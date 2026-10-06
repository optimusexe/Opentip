#!/usr/bin/env bash
# Stop only the PIDs recorded by launch.sh. Does not delete screenshots.
set -euo pipefail

STATE="/tmp/opentip-verify/state.json"
if [[ ! -f "$STATE" ]]; then
  echo "nothing to clean (no $STATE)"
  exit 0
fi

node --input-type=module <<'EOF'
import fs from "node:fs";

const state = JSON.parse(fs.readFileSync("/tmp/opentip-verify/state.json", "utf8"));

function cmdline(pid) {
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
      descendants(child, found);
      found.push(child);
    }
  }
  return found;
}

function signal(pid, sig) {
  try {
    process.kill(pid, sig);
    return true;
  } catch {
    return false;
  }
}

const nextPid = Number(state.nextPid || 0);
if (nextPid > 1 && cmdline(nextPid)) {
  const pids = [...descendants(nextPid), nextPid];
  for (const pid of pids) signal(pid, "SIGTERM");
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && cmdline(nextPid)) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  if (cmdline(nextPid)) {
    for (const pid of [...descendants(nextPid), nextPid]) signal(pid, "SIGKILL");
  }
  console.log(`stopped next pid ${nextPid} (tree ${pids.join(", ")})`);
} else {
  console.log(`next pid ${nextPid || "unset"} is not running`);
}

if (state.startedPostgres && state.postgresPid) {
  const pid = Number(state.postgresPid);
  const cmd = cmdline(pid);
  if (!cmd) {
    console.log(`postgres pid ${pid} is not running`);
  } else if (!cmd.includes("postgres")) {
    console.log(`leaving pid ${pid}; it is no longer the postgres process we started`);
  } else {
    signal(pid, "SIGTERM");
    console.log(`stopped postgres pid ${pid}`);
  }
} else {
  console.log("postgres was already running; left it alone");
}
EOF

rm -f /tmp/opentip-verify/state.json /tmp/opentip-verify/next.pid
echo "cleanup done. screenshots were not removed."
