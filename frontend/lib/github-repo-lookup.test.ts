import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyGithubRepoStatus,
  githubRepoFailure,
  githubRetryAfterSeconds,
  repoLookupCredentials,
  shouldFallbackUnauthenticated,
} from "./github-repo-lookup.ts";

test("separates a GitHub rate limit from a missing repo", () => {
  assert.equal(classifyGithubRepoStatus(404, "50", "Not Found"), "not_found");
  assert.equal(
    classifyGithubRepoStatus(403, "0", "API rate limit exceeded for 1.2.3.4"),
    "rate_limited",
  );
  assert.equal(classifyGithubRepoStatus(429, "0", "rate limit"), "rate_limited");
  assert.equal(classifyGithubRepoStatus(401, "10", "Bad credentials"), "unauthorized");
  assert.equal(classifyGithubRepoStatus(200, "10", ""), "ok");
});

test("reports rate limit only when no lookup said the repo was missing", () => {
  assert.deepEqual(githubRepoFailure(["rate_limited"], 42), {
    error: "GitHub rate limit exceeded, retry after 42s",
    status: 429,
  });
  assert.deepEqual(githubRepoFailure(["rate_limited", "not_found"], 42), {
    error: "repo not found",
    status: 404,
  });
  assert.deepEqual(githubRepoFailure(["unauthorized"], 42), {
    error: "could not load repo from GitHub",
    status: 502,
  });
});

test("turns the GitHub reset header into a retry delay", () => {
  assert.equal(githubRetryAfterSeconds("1700000060", 1_700_000_000_000), 60);
  assert.equal(githubRetryAfterSeconds(null), 60);
  assert.equal(githubRetryAfterSeconds("1", 10_000_000), 1);
});

test("uses a token before an unauthenticated lookup", () => {
  assert.deepEqual(repoLookupCredentials("user", "server"), ["user", "server"]);
  assert.deepEqual(repoLookupCredentials(null, null), [null]);
  assert.equal(shouldFallbackUnauthenticated(["unauthorized"]), true);
  assert.equal(shouldFallbackUnauthenticated(["rate_limited"]), true);
  assert.equal(shouldFallbackUnauthenticated(["not_found"]), false);
  assert.equal(shouldFallbackUnauthenticated(["ok"]), false);
});
