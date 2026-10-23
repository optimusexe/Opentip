import assert from "node:assert/strict";
import test from "node:test";
import ptr from "next/dist/compiled/path-to-regexp/index.js";
import nextConfig from "../frontend/next.config.js";
import {
  LEGACY_CASES,
  PASSTHROUGH_PATHS,
  legacyImageRewrites,
  legacyRedirects,
} from "../frontend/tip-redirects.mjs";

const { pathToRegexp, regexpToFunction, compile } = ptr;

function matchRule(source, pathname) {
  const keys = [];
  const regexp = pathToRegexp(source, keys, { delimiter: "/", sensitive: false });
  const matched = regexpToFunction(regexp, keys)(pathname);
  return matched ? matched.params : null;
}

function applyRules(rules, pathname) {
  for (const rule of rules) {
    const params = matchRule(rule.source, pathname);
    if (!params) continue;
    return compile(rule.destination, { validate: false })(params);
  }
  return null;
}

// Next checks every redirect before any rewrite, and appends the original query.
function resolveLegacy(urlPath) {
  const queryAt = urlPath.indexOf("?");
  const pathname = queryAt >= 0 ? urlPath.slice(0, queryAt) : urlPath;
  const query = queryAt >= 0 ? urlPath.slice(queryAt) : "";
  const redirected = applyRules(legacyRedirects(), pathname);
  if (redirected) return { kind: "redirect", location: redirected + query };
  const rewritten = applyRules(legacyImageRewrites(), pathname);
  if (rewritten) return { kind: "rewrite", location: rewritten + query };
  return { kind: "passthrough", location: pathname + query };
}

test("every old tipping route redirects to /tip and keeps the query", () => {
  for (const [from, to] of LEGACY_CASES) {
    const hit = resolveLegacy(`${from}?ref=old`);
    assert.equal(hit.kind, "redirect", from);
    assert.equal(hit.location, `${to}?ref=old`, from);
  }
});

test("repo card images are rewrites, not redirects", () => {
  for (const from of [
    "/vercel/next.js/opengraph-image",
    "/vercel/next.js/twitter-image",
    "/microsoft/vscode/opengraph-image",
  ]) {
    const hit = resolveLegacy(`${from}?v=1`);
    assert.equal(hit.kind, "rewrite", from);
    assert.equal(hit.location, `/tip${from}?v=1`, from);
  }
});

test("marketing, api, static files, and the new home stay put", () => {
  for (const path of PASSTHROUGH_PATHS) {
    const hit = resolveLegacy(path);
    assert.equal(hit.kind, "passthrough", path);
    assert.equal(hit.location, path, path);
  }
});

test("next.config serves this table and drops the old legal redirects", async () => {
  const redirects = await nextConfig.redirects();
  const rewrites = await nextConfig.rewrites();
  assert.deepEqual(redirects, legacyRedirects());
  assert.equal(redirects.some((rule) => rule.source === "/terms" || rule.source === "/privacy"), false);
  assert.equal(redirects.every((rule) => rule.permanent === true), true);
  const listed = Array.isArray(rewrites) ? rewrites : [...(rewrites.beforeFiles || []), ...(rewrites.afterFiles || []), ...(rewrites.fallback || [])];
  for (const rule of legacyImageRewrites()) {
    assert.equal(listed.some((item) => item.source === rule.source && item.destination === rule.destination), true, rule.source);
  }
});
