import assert from "node:assert/strict";
import test from "node:test";
import { oauthTokenUpdate } from "./account-token.ts";

test("keeps a fresh GitHub access token when relinking", () => {
  assert.deepEqual(
    oauthTokenUpdate({ access_token: "gho_new", token_type: "bearer", scope: "read:user public_repo" }),
    { access_token: "gho_new", token_type: "bearer", scope: "read:user public_repo" },
  );
});

test("does not wipe stored tokens with empty fields", () => {
  assert.deepEqual(oauthTokenUpdate({ access_token: "", refresh_token: null }), {});
});
