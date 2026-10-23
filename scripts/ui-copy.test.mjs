import assert from "node:assert/strict";
import test from "node:test";
import { copyProblems } from "../frontend/eslint-rules/opentip.js";

const home = "/workspace/frontend/components/home/HomePage.tsx";
const docs = "/workspace/frontend/app/tip/docs/for-developers/page.tsx";

test("No account needed to fund is rejected", () => {
  const problems = copyProblems("No account needed to fund", home);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /tip, tipped, tips, or Supporters/);
});

test("the hero line and its split prefix are allowed", () => {
  assert.deepEqual(copyProblems("Funding for open source, from the open market.", home), []);
  assert.deepEqual(copyProblems("Funding for open source,", home), []);
});

test("funds is not a banned fund-word", () => {
  assert.deepEqual(copyProblems("Can anyone claim any repo’s funds?", home), []);
});

test("OAR plus tipping must say coming soon", () => {
  const problems = copyProblems("The tipper can send OAR.", docs);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /OAR is coming soon/);
  assert.deepEqual(copyProblems("OAR is coming soon.", docs), []);
  assert.deepEqual(copyProblems("The tipper can send OAR.", "/workspace/frontend/app/tip/wallet/WalletClient.tsx"), []);
});
