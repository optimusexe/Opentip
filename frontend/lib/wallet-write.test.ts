import assert from "node:assert/strict";
import test from "node:test";
import { isUserRejectedWrite, walletWriteToast } from "./wallet-write.ts";

test("treats wallet cancel messages as a rejection", () => {
  assert.equal(isUserRejectedWrite({ message: "User rejected the request." }), true);
  assert.equal(isUserRejectedWrite({ shortMessage: "User denied transaction signature." }), true);
  assert.equal(isUserRejectedWrite({ name: "UserRejectedRequestError" }), true);
  assert.equal(isUserRejectedWrite({ message: "insufficient funds" }), false);
  assert.equal(isUserRejectedWrite(null), false);
});

test("uses a clear title for a cancelled or failed write", () => {
  assert.equal(
    walletWriteToast("approve", { message: "User rejected the request." }).title,
    "Transaction rejected",
  );
  assert.equal(walletWriteToast("tip", { message: "execution reverted" }).title, "Tip failed");
  assert.equal(walletWriteToast("claim", { shortMessage: "User rejected the request." }).title, "Transaction rejected");
  assert.equal(walletWriteToast("register", { message: "missing gas" }).title, "Register failed");
  assert.equal(walletWriteToast("approve", { message: "x".repeat(200) }).description.length, 120);
});
