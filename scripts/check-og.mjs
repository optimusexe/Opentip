import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const STATIC_FONT = 'new URL("./og-fonts/BricolageGrotesque-800.ttf", import.meta.url)';

export function ogPathProblems(source) {
  const problems = [];
  if (source.includes("./og-fonts/${")) {
    problems.push(
      'Open Graph fonts must use new URL("./og-fonts/<file>.ttf", import.meta.url). A computed path ./og-fonts/${...} is not traced on Vercel.',
    );
  }
  if (!source.includes(STATIC_FONT)) {
    problems.push(`loadOgFonts must read ${STATIC_FONT}.`);
  }
  return problems;
}

function repoRoot() {
  return fileURLToPath(new URL("..", import.meta.url));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = repoRoot();
  const source = readFileSync(`${root}/frontend/lib/og-image.tsx`, "utf8");
  const problems = ogPathProblems(source);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  execFileSync("npx", ["tsx", "--tsconfig", "tsconfig.json", "scripts/render-og-check.ts"], {
    cwd: `${root}/frontend`,
    stdio: "inherit",
  });
}
