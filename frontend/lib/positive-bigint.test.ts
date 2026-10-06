import assert from "node:assert/strict";
import test from "node:test";
import { isPositiveBigint } from "./positive-bigint.ts";

test("rejects zero and missing balances so they are not rendered as text", () => {
  assert.equal(isPositiveBigint(0n), false);
  assert.equal(0n && (0n > 0n), 0n);
  assert.equal(isPositiveBigint(undefined), false);
  assert.equal(isPositiveBigint(null), false);
  assert.equal(isPositiveBigint(0), false);
});

test("accepts a positive on-chain balance", () => {
  assert.equal(isPositiveBigint(1n), true);
  assert.equal(isPositiveBigint(10n ** 6n), true);
});
