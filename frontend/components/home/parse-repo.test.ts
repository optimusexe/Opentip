import assert from "node:assert/strict";
import test from "node:test";
import { fundingPath, parseGithubRepo } from "./parse-repo.ts";

test("accepts owner/repo", () => {
  assert.deepEqual(parseGithubRepo("vercel/next.js"), {
    owner: "vercel",
    repo: "next.js",
  });
});

test("accepts a github.com path and a full URL, including .git", () => {
  assert.deepEqual(parseGithubRepo("github.com/facebook/react"), {
    owner: "facebook",
    repo: "react",
  });
  assert.deepEqual(parseGithubRepo("https://github.com/facebook/react.git"), {
    owner: "facebook",
    repo: "react",
  });
  assert.deepEqual(parseGithubRepo("http://www.github.com/tokio-rs/tokio.git/"), {
    owner: "tokio-rs",
    repo: "tokio",
  });
});

test("preserves casing and strips query, hash, and surrounding space", () => {
  assert.deepEqual(
    parseGithubRepo("  HTTPS://GitHub.com/Owner/Repo.git?tab=readme#readme  "),
    { owner: "Owner", repo: "Repo" },
  );
});

test("accepts a dot-leading repo name", () => {
  assert.deepEqual(parseGithubRepo("acme/.github"), {
    owner: "acme",
    repo: ".github",
  });
});

test("builds an internal funding path", () => {
  assert.equal(fundingPath({ owner: "Owner", repo: "Repo" }), "/tip/Owner/Repo");
});

test("rejects malformed input", () => {
  for (const value of [
    "",
    "   ",
    "owner",
    "github.com/only-owner",
    "https://gitlab.com/owner/repo",
    "https://github.com/owner/repo/tree/main",
    "not a repo",
    "owner/repo/extra",
    "-owner/repo",
    "owner/-repo",
    "ow--ner/repo",
    "owner/..",
    "owner/repo.",
    "owner/my..repo",
    "https://github.com/",
  ]) {
    assert.equal(parseGithubRepo(value), null, value);
  }
});
