import assert from "node:assert/strict";
import test from "node:test";
import { verificationSendResult } from "./verification-email.ts";

test("keeps a created account when the verification email fails", () => {
  const signup = verificationSendResult("signup", false);
  assert.equal(signup.ok, false);
  if (!signup.ok) {
    assert.equal(signup.accountCreated, true);
    assert.match(signup.error, /resend/i);
    assert.equal(signup.error.toLowerCase().includes("ok"), false);
  }
  assert.deepEqual(verificationSendResult("signup", true), { ok: true });
});

test("tells a resend that the email did not send", () => {
  const resend = verificationSendResult("resend", false);
  assert.equal(resend.ok, false);
  if (!resend.ok) assert.equal(resend.error, "verification email failed to send");
});
