import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ADDED_LINE_RULES = [
  {
    name: "emdash",
    re: /—/g,
    message: "User-facing copy has no em dash. Use a period, a comma, or parentheses.",
  },
  {
    name: "palette",
    re: /(?:text|bg|border|ring|from|via|to|fill|stroke|placeholder|divide|outline|decoration)-(?:zinc|gray|neutral|slate|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g,
    message: "Use foreground, muted-foreground, brand, card, or border. Raw palette utilities fail in dark mode.",
  },
];

const UI_FILE = /^frontend\/(?:app|components)\/.+\.(?:tsx|ts|css)$/;

export function scanDiff(diff) {
  const problems = [];
  for (const file of parseDiff(diff)) {
    if (!UI_FILE.test(file.path)) continue;
    for (const rule of ADDED_LINE_RULES) {
      const added = countMatches(file.added.map((line) => line.text).join("\n"), rule.re);
      const removed = countMatches(file.removed.join("\n"), rule.re);
      if (added <= removed) continue;
      for (const line of file.added) {
        if (countMatches(line.text, rule.re) > 0) {
          problems.push(`${file.path}:${line.number} ${rule.message}`);
        }
      }
    }
  }
  return problems;
}

function countMatches(text, re) {
  re.lastIndex = 0;
  return [...text.matchAll(re)].length;
}

export function parseDiff(diff) {
  const files = [];
  let current = null;
  let nextNo = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      current = { path: match ? match[2] : "", added: [], removed: [] };
      files.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)/);
      nextNo = match ? Number(match[1]) : 0;
      continue;
    }
    if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("\\")) continue;
    if (line.startsWith("+")) {
      current.added.push({ number: nextNo, text: line.slice(1) });
      nextNo += 1;
      continue;
    }
    if (line.startsWith("-")) {
      current.removed.push(line.slice(1));
      continue;
    }
    nextNo += 1;
  }
  return files;
}

function branchDiff() {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const base = execFileSync("git", ["merge-base", "HEAD", "origin/master"], { cwd: root, encoding: "utf8" }).trim();
  return execFileSync("git", ["diff", "-U0", base, "--", "frontend/app", "frontend/components"], {
    cwd: root,
    encoding: "utf8",
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const problems = scanDiff(branchDiff());
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
}
