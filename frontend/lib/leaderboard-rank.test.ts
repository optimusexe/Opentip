import assert from "node:assert/strict";
import test from "node:test";
import { rankTippersByUsd, rowsForTopTippers, usdByRepo, type ToUsd } from "./leaderboard-rank.ts";

const ETH = "0x0000000000000000000000000000000000000000";
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

const toUsd: ToUsd = (raw, token, prices) => {
  const decimals = token.toLowerCase() === USDC ? 6 : 18;
  return (Number(raw) / 10 ** decimals) * (prices[token.toLowerCase()] ?? 0);
};

const prices = {
  [ETH]: 3000,
  [USDC]: 1,
};

test("ranks by USD before the limit, not by raw base units", () => {
  const rows = [
    // 0.001 ETH = $3, but the raw amount (1e15) is larger than the USDC row.
    { tipper_address: "0xBOB", total: "1000000000000000", token: ETH },
    // 10,000 USDC = $10,000, raw amount 1e10.
    { tipper_address: "0xALICE", total: "10000000000", token: USDC },
  ];
  const top = rankTippersByUsd(rows, prices, 1, toUsd);
  assert.equal(top.length, 1);
  assert.equal(top[0].tipper_address, "0xALICE");
  assert.ok(top[0].usd > 9000);
});

test("ranks repos by USD so a large ETH raw amount does not beat USDC", () => {
  const totals = usdByRepo(
    [
      { repo_id: "a/eth", token: ETH, total: "10000000000000000", count: 1 },
      { repo_id: "b/usdc", token: USDC, total: "100000000", count: 2 },
    ],
    prices,
    toUsd,
  );
  const ethUsd = totals.get("a/eth")!.usd;
  const usdcUsd = totals.get("b/usdc")!.usd;
  assert.ok(usdcUsd > ethUsd);
  assert.equal(totals.get("b/usdc")!.count, 2);
});

test("keeps every token row for the tippers who survive the USD limit", () => {
  const rows = [
    { tipper_address: "0xBOB", total: "1000000000000000", token: ETH },
    { tipper_address: "0xALICE", total: "10000000000", token: USDC },
    { tipper_address: "0xALICE", total: "1000000000000000000", token: ETH },
  ];
  const kept = rowsForTopTippers(rows, prices, 1, toUsd);
  assert.deepEqual(kept.map((row) => row.tipper_address), ["0xALICE", "0xALICE"]);
});
