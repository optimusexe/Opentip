import assert from "node:assert/strict";
import test from "node:test";
import { acceptDisplayNameSignature, displayNameMessage } from "./display-name.ts";

test("binds the display name to the wallet address", () => {
  assert.equal(
    displayNameMessage("Ada", "0x1111111111111111111111111111111111111111"),
    "Set display name: Ada for 0x1111111111111111111111111111111111111111",
  );
});

test("accepts a local signature, then a contract signature, then an owner signature", async () => {
  assert.equal(await acceptDisplayNameSignature({
    local: async () => true,
    contract: async () => { throw new Error("should not run"); },
    owner: async () => false,
  }), true);

  assert.equal(await acceptDisplayNameSignature({
    local: async () => false,
    contract: async () => true,
    owner: async () => false,
  }), true);

  assert.equal(await acceptDisplayNameSignature({
    local: async () => { throw new Error("bad signature"); },
    contract: async () => false,
    owner: async () => true,
  }), true);

  assert.equal(await acceptDisplayNameSignature({
    local: async () => false,
    contract: async () => false,
    owner: async () => false,
  }), false);
});
