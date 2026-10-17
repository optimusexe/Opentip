import assert from "node:assert/strict";
import test from "node:test";
import { localDbProblems, repoLocalDbProblems } from "./check-local-db.mjs";
import { fileURLToPath } from "node:url";

const unguarded = `import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
await prisma.walletTx.findMany();
`;

test("a script that opens Prisma without assertLocalDb is refused", () => {
  const problems = localDbProblems(unguarded, "frontend/e2e/wallet-history-keys.mjs");
  assert.equal(problems.length, 1);
  assert.match(problems[0], /scripts\/assert-local-db\.mjs/);
  assert.match(problems[0], /assertLocalDb/);
});

test("importing assertLocalDb is enough for the guard", () => {
  const source = `import { assertLocalDb } from "../../scripts/assert-local-db.mjs";
import { PrismaClient } from "@prisma/client";
assertLocalDb();
const prisma = new PrismaClient();
`;
  assert.deepEqual(localDbProblems(source, "frontend/e2e/wallet-history-keys.mjs"), []);
});

test("the app and indexer clients are not local-only", () => {
  const source = `export const prisma = new PrismaClient();`;
  assert.deepEqual(localDbProblems(source, "frontend/lib/prisma.ts"), []);
  assert.deepEqual(localDbProblems(source, "indexer/src/index.ts"), []);
});

test("the repo scripts that open Prisma import the guard", () => {
  const repo = fileURLToPath(new URL("..", import.meta.url));
  assert.deepEqual(repoLocalDbProblems(repo), []);
});
