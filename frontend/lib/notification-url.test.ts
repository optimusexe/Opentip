import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sameOriginNotificationUrl } from "./notification-url.ts";

function serviceWorkerCopy() {
  const src = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.equal(/^\s*import\s/m.test(src), false);
  const start = src.indexOf("function sameOriginNotificationUrl");
  const end = src.indexOf("\nself.addEventListener(\"push\"");
  assert.ok(start > 0 && end > start);
  return new Function(`${src.slice(start, end)}\nreturn sameOriginNotificationUrl;`)();
}

const origin = "https://opentip.tech";

test("keeps same-origin paths and absolute URLs", () => {
  assert.equal(sameOriginNotificationUrl("/dashboard", origin), "https://opentip.tech/dashboard");
  assert.equal(
    sameOriginNotificationUrl("https://opentip.tech/wallet?tab=1#x", origin),
    "https://opentip.tech/wallet?tab=1#x",
  );
  assert.equal(sameOriginNotificationUrl("/", origin), "https://opentip.tech/");
  assert.equal(sameOriginNotificationUrl("", origin), "https://opentip.tech/tip");
});

test("falls back to /tip for cross-origin and non-http URLs", () => {
  const fallback = "https://opentip.tech/tip";
  for (const raw of [
    "https://evil.example/phish",
    "http://evil.example",
    "//evil.example/phish",
    "https://opentip.tech.evil.example/",
    "javascript:alert(1)",
    "data:text/html,hi",
    "https://user:pass@evil.example/",
  ]) {
    assert.equal(sameOriginNotificationUrl(raw, origin), fallback, raw);
  }
});

test("the classic service worker copies this helper", () => {
  const fromWorker = serviceWorkerCopy();
  const samples = ["/", "/dashboard", "https://opentip.tech/wallet", "https://evil.example", "//evil.example", "javascript:alert(1)", ""];
  for (const raw of samples) {
    assert.equal(fromWorker(raw, origin), sameOriginNotificationUrl(raw, origin), raw);
  }
});
