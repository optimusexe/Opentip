import assert from "node:assert/strict";
import test from "node:test";
import { toTipPath } from "./tip-path.ts";

test("prefixes tipping paths and keeps the query", () => {
  assert.equal(toTipPath("/dashboard"), "/tip/dashboard");
  assert.equal(toTipPath("/vercel/next.js"), "/tip/vercel/next.js");
  assert.equal(toTipPath("/wallet?tab=1#x"), "/tip/wallet?tab=1#x");
  assert.equal(toTipPath("/"), "/tip");
});

test("leaves marketing, api, and already prefixed paths alone", () => {
  assert.equal(toTipPath("/tip/docs"), "/tip/docs");
  assert.equal(toTipPath("/tip"), "/tip");
  assert.equal(toTipPath("/api/auth/session"), "/api/auth/session");
  assert.equal(toTipPath("/beta"), "/beta");
  assert.equal(toTipPath("/terms"), "/terms");
  assert.equal(toTipPath("/privacy"), "/privacy");
});

test("rejects off-site targets", () => {
  assert.equal(toTipPath("https://evil.example"), "/tip");
  assert.equal(toTipPath("//evil.example"), "/tip");
  assert.equal(toTipPath("dashboard", "/tip/dashboard"), "/tip/dashboard");
});
