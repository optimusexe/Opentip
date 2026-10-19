import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const TWITTER_EXPORT = /export\s*\{([^}]+)\}\s*from\s*["']\.\/opengraph-image["']/;
const REQUIRED_EXPORTS = ["default", "alt", "size", "contentType"];

export function layoutTwitterImageProblems(source) {
  const start = source.search(/\btwitter\s*:\s*\{/);
  if (start < 0) return [];
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const block = end === -1 ? source.slice(start) : source.slice(start, end + 1);
  if (/\bimages\s*:/.test(block)) {
    return [
      "frontend/app/layout.tsx sets twitter.images. That static image overrides a route card. Leave images off the root twitter metadata.",
    ];
  }
  return [];
}

export function twitterImageFileProblems(source, file) {
  const match = source.match(TWITTER_EXPORT);
  if (!match) {
    return [`${file} must re-export the opengraph-image default, alt, size, and contentType.`];
  }
  const names = match[1].split(",").map((part) => part.trim()).filter(Boolean);
  const missing = REQUIRED_EXPORTS.filter((name) => !names.includes(name));
  if (missing.length > 0) {
    return [`${file} is missing re-exports: ${missing.join(", ")}.`];
  }
  return [];
}

function walk(dir, problems, root) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const abs = join(dir, name);
    const info = statSync(abs);
    if (info.isDirectory()) {
      walk(abs, problems, root);
      continue;
    }
    if (!/^opengraph-image\./.test(name)) continue;
    const sibling = readdirSync(dir).find((entry) => /^twitter-image\./.test(entry));
    const relDir = dir.slice(root.length + 1);
    if (!sibling) {
      problems.push(`${relDir} has ${name} and no twitter-image file.`);
      continue;
    }
    const twitterPath = join(dir, sibling);
    const rel = join(relDir, sibling);
    problems.push(...twitterImageFileProblems(readFileSync(twitterPath, "utf8"), rel));
  }
}

export function repoShareCardProblems(repo) {
  const problems = [];
  const layout = readFileSync(join(repo, "frontend/app/layout.tsx"), "utf8");
  problems.push(...layoutTwitterImageProblems(layout));
  walk(join(repo, "frontend/app"), problems, repo);
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const repo = fileURLToPath(new URL("..", import.meta.url));
  const problems = repoShareCardProblems(repo);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
}
