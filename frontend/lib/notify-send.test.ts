import assert from "node:assert/strict";
import test from "node:test";
import { planNotificationSend } from "./notification-send.ts";

test("a missing row is created and pushed", () => {
  assert.equal(planNotificationSend(null), "create");
  assert.equal(planNotificationSend(undefined), "create");
});

test("a pending row saved by the indexer still gets one push", () => {
  assert.equal(planNotificationSend({ status: "pending" }), "deliver_existing");
});

test("sent and in-flight rows stay deduped", () => {
  assert.equal(planNotificationSend({ status: "sent" }), "dedupe");
  assert.equal(planNotificationSend({ status: "sending" }), "dedupe");
});
