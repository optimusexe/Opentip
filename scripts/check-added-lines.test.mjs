import assert from "node:assert/strict";
import test from "node:test";
import { scanDiff } from "./check-added-lines.mjs";

test("the self-paid gas sentence from TipClient before the shared label is a new em dash", () => {
  const file = "frontend/app/[owner]/[repo]/TipClient.tsx";
  const diff = [
    `diff --git a/${file} b/${file}`,
    "@@ -471,0 +471,1 @@",
    '+            : " (you paid gas — daily sponsorship used up)"',
  ].join("\n");
  const problems = scanDiff(diff);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no em dash/);
});
test("keeping an em dash that was already on the line does not add one", () => {
  const file = "frontend/app/docs/smart-contract/page.tsx";
  const diff = [
    `diff --git a/${file} b/${file}`,
    "@@ -168,1 +168,1 @@",
    '-          { name: "receiveTip", returns: "—", description: "Accept an ERC-20 tip (USDC, OAR, etc)." },',
    '+          { name: "receiveTip", returns: "—", description: "Accept an ERC-20 tip (USDC). OAR is coming soon." },',
  ].join("\n");
  assert.deepEqual(scanDiff(diff), []);
});
test("a file outside the UI trees is ignored", () => {
  const diff = [
    "diff --git a/frontend/lib/notes.ts b/frontend/lib/notes.ts",
    "@@ -1,0 +1,1 @@",
    "+export const x = \"text-zinc-900 —\";",
  ].join("\n");
  assert.deepEqual(scanDiff(diff), []);
});
