#!/usr/bin/env node
// Read-only health check for the verification instance.
// Confirms the process on port 3000 is the Next server we started, that it
// serves Opentip, and that the local database answers with the fixture repo.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { FIXTURE_REPO, FIXTURE_SUPPORTER, PORT } from "./fixture.mjs";

const STATE = "/tmp/opentip-verify/state.json";
const failures = [];

function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function ok(message) {
  console.log(`ok   ${message}`);
}

function readCmdline(pid) {
  try {
    return fs.readFileSync(`/proc/${pid}/cmdline`).toString().replace(/\0/g, " ").trim();
  } catch {
    return "";
  }
}

function descendants(pid, found = []) {
  let entries = [];
  try {
    entries = fs.readdirSync("/proc");
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    let stat = "";
    try {
      stat = fs.readFileSync(`/proc/${entry}/stat`, "utf8");
    } catch {
      continue;
    }
    const rest = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    if (Number(rest[1]) === pid) {
      const child = Number(entry);
      found.push(child);
      descendants(child, found);
    }
  }
  return found;
}

function listeningPids(port) {
  const hex = port.toString(16).toUpperCase().padStart(4, "0");
  const inodes = new Set();
  for (const file of ["/proc/net/tcp", "/proc/net/tcp6"]) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").trim().split("\n").slice(1);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const localPort = parts[1]?.split(":").pop()?.toUpperCase();
      if (parts[3] === "0A" && localPort === hex) inodes.add(parts[9]);
    }
  }
  const pids = new Set();
  if (inodes.size === 0) return [];
  for (const entry of fs.readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    const fdDir = path.join("/proc", entry, "fd");
    let fds = [];
    try {
      fds = fs.readdirSync(fdDir);
    } catch {
      continue;
    }
    for (const fd of fds) {
      try {
        const target = fs.readlinkSync(path.join(fdDir, fd));
        const match = /^socket:\[(\d+)\]$/.exec(target);
        if (match && inodes.has(match[1])) pids.add(Number(entry));
      } catch {
        // fd vanished between readdir and readlink
      }
    }
  }
  return [...pids];
}

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

let state;
try {
  state = JSON.parse(fs.readFileSync(STATE, "utf8"));
} catch {
  fail(`missing ${STATE}. Run launch.sh first.`);
  process.exit(1);
}

const nextPid = Number(state.nextPid);
const family = new Set([nextPid, ...descendants(nextPid)]);
if (!readCmdline(nextPid)) {
  fail(`recorded next pid ${nextPid} is not running`);
} else if (![...family].some((pid) => readCmdline(pid).includes("next"))) {
  fail(`pid ${nextPid} tree has no next process (${[...family].map(readCmdline).join(" | ")})`);
} else {
  ok(`next pid ${nextPid} is alive`);
}

const listeners = listeningPids(PORT);
const owned = listeners.filter((pid) => family.has(pid));
if (owned.length === 0) {
  fail(`port ${PORT} listeners [${listeners.join(", ") || "none"}] are not the recorded next process`);
} else {
  ok(`port ${PORT} is held by pid ${owned.join(", ")}`);
}

const log = state.log || "/tmp/opentip-verify/next.log";
const logText = fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "";
if (!/Ready|Local:/.test(logText)) {
  fail(`dev log ${log} has no Ready/Local line`);
} else {
  ok("dev log reports the server ready");
}

const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../frontend/.env.local");
const envText = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
if (!envText.startsWith("# OPENTIP_VERIFY_SCAFFOLDING")) {
  fail(`${envFile} is missing the verification scaffolding marker`);
} else {
  ok("frontend/.env.local is the verification scaffolding file");
}

const pages = [
  ["/", "Funding for open source"],
  ["/docs", "Documentation"],
  ["/leaderboard", FIXTURE_SUPPORTER],
  ["/repos", "Repos"],
  ["/signin", "Sign in"],
  [`/${FIXTURE_REPO}`, "Next.js"],
];

for (const [route, needle] of pages) {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}${route}`, { signal: AbortSignal.timeout(45000) });
    const body = await response.text();
    if (response.status !== 200 || !body.includes(needle)) {
      fail(`${route} status ${response.status}, expected body to include ${JSON.stringify(needle)}`);
    } else {
      ok(`${route} 200 includes ${JSON.stringify(needle)}`);
    }
  } catch (error) {
    fail(`${route} request failed: ${error.message}`);
  }
}

const env = loadEnv(envFile);
process.env.DATABASE_URL = env.DATABASE_URL || "";
if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL missing from frontend/.env.local");
} else {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const repo = await prisma.repo.findUnique({ where: { repo_id: FIXTURE_REPO } });
    if (!repo || repo.hidden) fail(`database has no visible ${FIXTURE_REPO} row`);
    else ok(`database reachable and ${FIXTURE_REPO} is seeded`);
  } catch (error) {
    fail(`database query failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (failures.length) {
  console.error(`doctor: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("doctor: healthy");
