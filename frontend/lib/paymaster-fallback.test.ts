import assert from "node:assert/strict";
import test from "node:test";
import { selfPaidGasReason } from "./paymaster-fallback.ts";

test("falls back to self-paid gas on 429, 502, and 503", () => {
  assert.equal(selfPaidGasReason({ status: 429 }), "cap");
  assert.equal(selfPaidGasReason({ statusCode: 502 }), "paymaster");
  assert.equal(selfPaidGasReason({ response: { status: 503 } }), "paymaster");
  assert.equal(selfPaidGasReason({ message: "daily sponsorship limit reached" }), "cap");
});

test("does not treat other paymaster errors as a gas fallback", () => {
  assert.equal(selfPaidGasReason({ status: 401 }), null);
  assert.equal(selfPaidGasReason({ status: 403, message: "transactions are paused" }), null);
  assert.equal(selfPaidGasReason({ status: 500, message: "paymaster not configured" }), null);
  assert.equal(selfPaidGasReason(null), null);
});
