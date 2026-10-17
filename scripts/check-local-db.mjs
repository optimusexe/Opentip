import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOTS = [
  "indexer/reset.js",
  "frontend/e2e",
  ".cursor/skills/verify-opentip",
  "scripts",
];

const SKIP = new Set([
  "scripts/assert-local-db.mjs",
  "scripts/check-local-db.mjs",
  "scripts/check-local-db.test.mjs",
  "scripts/check-added-lines.mjs",
  "scripts/check-added-lines.test.mjs",
  "scripts/check-prisma-drift.mjs",
  "scripts/check-og.mjs",
  "scripts/check-og.test.mjs",
  "scripts/ui-copy.test.mjs",
]);

export function localDbProblems(source, filename) {
  const file = filename.replaceAll("\\", "/");
  if (SKIP.has(file) || file.includes("indexer/src/") || file.endsWith("frontend/lib/prisma.ts")) return [];
  if (!source.includes("PrismaClient")) return [];
  if (source.includes("assertLocalDb") && source.includes("scripts/assert-local-db.mjs")) return [];
  return [`${file} opens PrismaClient. Import assertLocalDb from scripts/assert-local-db.mjs and call it before new PrismaClient().`];
}

function walk(root, repo) {
  const abs = join(repo, root);
  let info;
  try {
    info = statSync(abs);
  } catch {
    return [];
  }
  if (info.isFile()) return [root];
  const out = [];
  for (const name of readdirSync(abs)) {
    if (name === "node_modules") continue;
    const rel = join(root, name);
    const child = statSync(join(repo, rel));
    if (child.isDirectory()) out.push(...walk(rel, repo));
    else if (/\.(mjs|cjs|js|ts)$/.test(name)) out.push(rel);
  }
  return out;
}

export function repoLocalDbProblems(repo) {
  const problems = [];
  for (const root of ROOTS) {
    for (const file of walk(root, repo)) {
      const source = readFileSync(join(repo, file), "utf8");
      problems.push(...localDbProblems(source, file));
    }
  }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const repo = fileURLToPath(new URL("..", import.meta.url));
  const problems = repoLocalDbProblems(repo);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
}
