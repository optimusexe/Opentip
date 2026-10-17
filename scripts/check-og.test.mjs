import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ogPathProblems } from "./check-og.mjs";

test("the computed og-fonts path from 81ea12d is rejected", () => {
  const historical = "const buf = await readBundledAsset(`./og-fonts/${face.file}`);";
  const problems = ogPathProblems(historical);
  assert.equal(problems.length >= 1, true);
  assert.match(problems[0], /new URL\("\.\/og-fonts\/<file>\.ttf", import\.meta\.url\)/);
});

test("the current loader uses a static font URL", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const source = readFileSync(`${root}/frontend/lib/og-image.tsx`, "utf8");
  assert.deepEqual(ogPathProblems(source), []);
});
