import assert from "node:assert/strict";
import test from "node:test";
import { isExpiredPushError, subscriptionWantsType } from "./notification-push.ts";

test("sends a push only for a type the user selected", () => {
  assert.equal(subscriptionWantsType(["tip_received"], "tip_received"), true);
  assert.equal(subscriptionWantsType(["tip_received"], "claim_available"), false);
  assert.equal(subscriptionWantsType([], "tip_received"), false);
  assert.equal(subscriptionWantsType(null, "tip_received"), false);
});

test("treats 404 and 410 as an expired push subscription", () => {
  assert.equal(isExpiredPushError({ statusCode: 404 }), true);
  assert.equal(isExpiredPushError({ status: 410 }), true);
  assert.equal(isExpiredPushError({ statusCode: 401 }), false);
  assert.equal(isExpiredPushError(new Error("network")), false);
});
