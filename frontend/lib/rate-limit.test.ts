import assert from "node:assert/strict";
import test from "node:test";
import { clientAddress, rateLimitKey } from "./rate-limit.ts";

function request(headers: Record<string, string>): Request {
  return new Request("https://opentip.tech/api/auth/signup", { headers });
}

test("reads the client IP from the headers Vercel sends", () => {
  assert.equal(clientAddress((name) => name === "x-forwarded-for" ? "203.0.113.4, 10.0.0.1" : null), "203.0.113.4");
  assert.equal(clientAddress((name) => name === "x-real-ip" ? "203.0.113.8" : null), "203.0.113.8");
  assert.equal(clientAddress(() => null), null);
});

test("limits signed-out signup attempts by IP instead of one shared bucket", () => {
  const a = rateLimitKey(request({ "x-forwarded-for": "203.0.113.4" }));
  const b = rateLimitKey(request({ "x-forwarded-for": "203.0.113.5" }));
  const anon = rateLimitKey(request({}));
  assert.equal(a, "203.0.113.4");
  assert.equal(b, "203.0.113.5");
  assert.notEqual(a, b);
  assert.equal(anon, "anonymous");
});

test("keeps a session on its own bucket ahead of the IP", () => {
  const key = rateLimitKey(request({
    cookie: "next-auth.session-token=abcdefghijklmnopqr; Path=/",
    "x-forwarded-for": "203.0.113.4",
  }));
  assert.equal(key, "abcdefghijklmnop");
});
