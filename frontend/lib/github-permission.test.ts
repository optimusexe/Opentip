import assert from "node:assert/strict";
import test from "node:test";
import { githubAuthTokens, ownershipAuthError, permissionAllowsRegister } from "./github-permission.ts";

test("lets org maintainers and write collaborators register", () => {
  assert.equal(permissionAllowsRegister("admin"), true);
  assert.equal(permissionAllowsRegister("maintain"), true);
  assert.equal(permissionAllowsRegister("write"), true);
  assert.equal(permissionAllowsRegister("push"), true);
  assert.equal(permissionAllowsRegister("triage"), false);
  assert.equal(permissionAllowsRegister("read"), false);
  assert.equal(permissionAllowsRegister(undefined), false);
});

test("tells an email-only session to connect GitHub", () => {
  assert.equal(ownershipAuthError(null), "not authenticated");
  assert.equal(ownershipAuthError({ user: {} }), "not authenticated");
  assert.equal(ownershipAuthError({ user: { id: "user_1" } }), "Connect GitHub to verify ownership");
  assert.equal(ownershipAuthError({ user: { id: "user_1", login: "octocat" } }), null);
});

test("tries the user OAuth token before the server token", () => {
  assert.deepEqual(githubAuthTokens("user-token", "server-token"), ["user-token", "server-token"]);
  assert.deepEqual(githubAuthTokens(null, "server-token"), ["server-token"]);
  assert.deepEqual(githubAuthTokens("same", "same"), ["same"]);
  assert.deepEqual(githubAuthTokens("  user  ", ""), ["user"]);
});
