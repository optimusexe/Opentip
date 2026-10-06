import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_NOTIFICATION_TYPES,
  displayedNotificationTypes,
  isExpiredPushError,
  subscriptionWantsType,
  typesForNewSubscription,
} from "./notification-push.ts";

const defaults = [...DEFAULT_NOTIFICATION_TYPES];

test("sends a push only for a type the user selected", () => {
  assert.equal(subscriptionWantsType(["tip_received"], "tip_received"), true);
  assert.equal(subscriptionWantsType(["tip_received"], "claim_available"), false);
  assert.equal(subscriptionWantsType([], "tip_received"), false);
  assert.equal(subscriptionWantsType(null, "tip_received"), false);
});

test("a first subscription with no choice gets the four funding types", () => {
  assert.deepEqual(typesForNewSubscription({ hasExisting: false }), defaults);
  assert.deepEqual(typesForNewSubscription({ provided: [], hasExisting: false }), defaults);
  assert.deepEqual(typesForNewSubscription({ provided: null, hasExisting: false }), defaults);
});

test("a first subscription keeps an explicit type list", () => {
  assert.deepEqual(
    typesForNewSubscription({ provided: ["tip_received"], hasExisting: false }),
    ["tip_received"],
  );
});

test("a new device inherits saved types, including an explicit empty list", () => {
  assert.deepEqual(
    typesForNewSubscription({
      provided: [],
      existing: ["claim_available"],
      hasExisting: true,
    }),
    ["claim_available"],
  );
  assert.deepEqual(
    typesForNewSubscription({ provided: defaults, existing: [], hasExisting: true }),
    [],
  );
});

test("the dashboard shows the defaults until a subscription exists", () => {
  assert.deepEqual(displayedNotificationTypes(undefined, false), defaults);
  assert.deepEqual(displayedNotificationTypes([], true), []);
  assert.deepEqual(displayedNotificationTypes(["tip_sent"], true), ["tip_sent"]);
});

test("treats 404 and 410 as an expired push subscription", () => {
  assert.equal(isExpiredPushError({ statusCode: 404 }), true);
  assert.equal(isExpiredPushError({ status: 410 }), true);
  assert.equal(isExpiredPushError({ statusCode: 401 }), false);
  assert.equal(isExpiredPushError(new Error("network")), false);
});
