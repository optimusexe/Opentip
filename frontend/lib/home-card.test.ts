import assert from "node:assert/strict";
import test from "node:test";
import {
  hiddenRepoSet,
  isMissingTipperName,
  repoTipLabel,
  tipperLabel,
  visibleFundingUsd,
  type ToUsd,
} from "./home-card.ts";

const USDC = "0x036cbd53842c5426634e7929541ec2318f3dcf7e";
const prices = { [USDC]: 1 };
const toUsd: ToUsd = (raw, token, quotes) => {
  const amount = Number(raw) / 1e6;
  return amount * (quotes[token.toLowerCase()] ?? 0);
};

test("sums USD across visible repos and skips hidden ids in any case", () => {
  const hidden = hiddenRepoSet(["Acme/Secret"]);
  const total = visibleFundingUsd(
    [
      { repo_id: "vercel/next.js", token: USDC, amount: "90000000" },
      { repo_id: "facebook/react", token: USDC, amount: "52000000" },
      { repo_id: "acme/secret", token: USDC, amount: "500000000" },
    ],
    hidden,
    prices,
    toUsd,
  );
  assert.equal(total, 142);
});

test("returns null when every tip is on a hidden repo", () => {
  const hidden = hiddenRepoSet(["acme/secret"]);
  assert.equal(
    visibleFundingUsd(
      [{ repo_id: "Acme/Secret", token: USDC, amount: "1000000" }],
      hidden,
      prices,
      toUsd,
    ),
    null,
  );
});

test("shows a saved display name, including Unknown", () => {
  const address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  assert.equal(isMissingTipperName(null), true);
  assert.equal(isMissingTipperName(undefined), true);
  assert.equal(isMissingTipperName(""), true);
  assert.equal(isMissingTipperName("   "), true);
  assert.equal(isMissingTipperName("Unknown"), false);
  assert.equal(isMissingTipperName("unknown"), false);
  assert.equal(isMissingTipperName("UNKNOWN"), false);
  assert.equal(tipperLabel(null, address), "0xaaaa…aaaa");
  assert.equal(tipperLabel("   ", address), "0xaaaa…aaaa");
  assert.equal(tipperLabel("Unknown", address), "Unknown");
  assert.equal(tipperLabel("unknown", address), "unknown");
  assert.equal(tipperLabel("UNKNOWN", address), "UNKNOWN");
  assert.equal(tipperLabel(" unknown ", address), " unknown ");
  assert.equal(tipperLabel("  Ada  ", address), "  Ada  ");
});

test("labels a tip with the capitalized repo name", () => {
  assert.equal(repoTipLabel("vercel/next.js"), "Next.js");
  assert.equal(repoTipLabel("facebook/react"), "React");
  assert.equal(repoTipLabel("opentip"), "Opentip");
});
