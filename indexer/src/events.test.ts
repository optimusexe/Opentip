import assert from "node:assert/strict";
import test from "node:test";
import { claimedNotification, notificationDispatch, payoutUpdateFromEvent } from "./events.ts";

test("pushes a new or still-pending notification exactly once", () => {
  assert.equal(notificationDispatch(null), "create");
  assert.equal(notificationDispatch(undefined), "create");
  assert.equal(notificationDispatch({ status: "pending" }), "push");
  assert.equal(notificationDispatch({ status: "sending" }), "skip");
  assert.equal(notificationDispatch({ status: "sent" }), "skip");
});

test("describes a claim as funds withdrawn, not as a future claim", () => {
  const notice = claimedNotification("acme/app", "10 USDC");
  assert.equal(notice.title, "Tips paid out");
  assert.match(notice.body, /withdrawn/);
  assert.equal(notice.body.includes("can now claim"), false);
  assert.match(claimedNotification("acme/app", null).body, /withdrawn/);
});


test("updates the payout address from an admin reassignment", () => {
  assert.deepEqual(
    payoutUpdateFromEvent("AdminPayoutReassigned", {
      repoId: "acme/app",
      newAddress: "0xABCDef0000000000000000000000000000000001",
    }),
    { repoId: "acme/app", payoutAddress: "0xabcdef0000000000000000000000000000000001" },
  );
});

test("keeps the owner rotation on the same path", () => {
  assert.deepEqual(
    payoutUpdateFromEvent("PayoutAddressUpdated", {
      repoId: "acme/app",
      newAddress: "0x1111111111111111111111111111111111111111",
    })?.payoutAddress,
    "0x1111111111111111111111111111111111111111",
  );
  assert.equal(payoutUpdateFromEvent("TipReceived", { repoId: "acme/app" }), null);
});
