import assert from "node:assert/strict";
import test from "node:test";
import { GITHUB_REPO_AFFILIATION, githubReposErrorMessage, parseGithubRepoPage } from "./github-repo-page.ts";

test("includes org repos reached through team membership", () => {
  assert.match(GITHUB_REPO_AFFILIATION, /organization_member/);
  assert.match(GITHUB_REPO_AFFILIATION, /owner/);
  assert.match(GITHUB_REPO_AFFILIATION, /collaborator/);
});

test("hides raw GitHub error bodies", () => {
  assert.match(githubReposErrorMessage(401), /Continue with GitHub/);
  assert.equal(githubReposErrorMessage(403).includes("{"), false);
  assert.match(githubReposErrorMessage(500), /Couldn't load/);
});

test("defaults and accepts in-range integers", () => {
  assert.deepEqual(parseGithubRepoPage(null, null), { page: 1, per_page: 20 });
  assert.deepEqual(parseGithubRepoPage("2", "100"), { page: 2, per_page: 100 });
});

test("rejects unsanitized and out-of-range page params", () => {
  for (const [page, perPage] of [
    ["0", "20"],
    ["-1", "20"],
    ["1.5", "20"],
    ["1;drop", "20"],
    ["1 OR 1=1", "20"],
    ["101", "20"],
    ["1", "0"],
    ["1", "101"],
    ["1", "-1"],
    ["1", "20.5"],
    ["1", "100&page=1"],
    ["", "20"],
  ] as const) {
    const result = parseGithubRepoPage(page, perPage);
    assert.ok("error" in result, `${page} ${perPage}`);
  }
});
