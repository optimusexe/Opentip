import assert from "node:assert/strict";
import test from "node:test";
import { scanDiff } from "./check-added-lines.mjs";

const zinc = "frontend/app/admin/page.tsx";
const historicalZinc = '<div className="stats mt-2 text-xl text-zinc-900">{formatted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>';

test("text-zinc-900 from admin before c6fb3e9 is a new palette utility", () => {
  const diff = [
    `diff --git a/${zinc} b/${zinc}`,
    "@@ -137,0 +137,1 @@",
    `+${historicalZinc}`,
  ].join("\n");
  const problems = scanDiff(diff);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /foreground, muted-foreground, brand, card, or border/);
  assert.match(problems[0], /frontend\/app\/admin\/page\.tsx:137/);
});

test("editing a line that already uses a palette utility does not add one", () => {
  const diff = [
    `diff --git a/${zinc} b/${zinc}`,
    "@@ -137,1 +137,1 @@",
    `-${historicalZinc}`,
    `+${historicalZinc.replace("text-xl", "text-2xl")}`,
  ].join("\n");
  assert.deepEqual(scanDiff(diff), []);
});

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

test("key={i} is a new index key", () => {
  const file = "frontend/app/wallet/WalletClient.tsx";
  const diff = [
    `diff --git a/${file} b/${file}`,
    "@@ -400,0 +400,1 @@",
    "+              <div key={i} className=\"row\">",
  ].join("\n");
  const problems = scanDiff(diff);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /historyRowKey from frontend\/lib\/history-row-key\.ts/);
});

test("a file outside the UI trees is ignored", () => {
  const diff = [
    "diff --git a/frontend/lib/notes.ts b/frontend/lib/notes.ts",
    "@@ -1,0 +1,1 @@",
    "+export const x = \"text-zinc-900 —\";",
  ].join("\n");
  assert.deepEqual(scanDiff(diff), []);
});
