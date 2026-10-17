import assert from "node:assert/strict";
import test from "node:test";
import { historyRowKey } from "./history-row-key.ts";

test("two claim legs with one hash do not share a key", () => {
  const hash = "0x7687000000000000000000000000000000000000000000000000000000000abc";
  const eth = historyRowKey({ direction: "in", kind: "claim", hash, token: "0x0000000000000000000000000000000000000000", symbol: "ETH" }, 0);
  const usdc = historyRowKey({ direction: "in", kind: "claim", hash, token: "0x036cbd53842c5426634e7929541ec2318f3dcf7e", symbol: "USDC" }, 1);
  assert.notEqual(eth, usdc);
  assert.equal(eth.includes(hash), true);
  assert.equal(usdc.includes("0x036cbd53842c5426634e7929541ec2318f3dcf7e"), true);
});

test("a key built from the hash alone collides, which is the stuck-row bug", () => {
  const hash = "0x7687000000000000000000000000000000000000000000000000000000000abc";
  const legacy = (token: string) => `in-claim-${hash}`;
  assert.equal(legacy("ETH"), legacy("USDC"));
  const eth = historyRowKey({ direction: "in", kind: "claim", hash, token: "ETH" }, 0);
  const usdc = historyRowKey({ direction: "in", kind: "claim", hash, token: "USDC" }, 1);
  assert.notEqual(eth, usdc);
});
