import assert from "node:assert/strict";
import test from "node:test";
import { amountFontSize, displayOwner, displayRepoName, displayRepoUrl } from "./og-layout.ts";

test("short repo names use the large card size", () => {
  const name = displayRepoName("opentip");
  assert.equal(name.text, "Opentip");
  assert.equal(name.fontSize, 45);
});

test("long repo names step down and stay under the length cap", () => {
  const name = displayRepoName("vscode-extension-samples");
  assert.equal(name.text.replace(/\u200b/g, ""), "Vscode-extension-samples");
  assert.equal(name.fontSize, 37);

  const huge = displayRepoName("a".repeat(80));
  const visible = huge.text.replace(/\u200b/g, "");
  assert.equal(visible.length, 36);
  assert.ok(visible.endsWith("…"));
  assert.equal(huge.fontSize, 28);
  assert.ok(huge.text.includes("\u200b"));
});

test("owner names stay on the byline", () => {
  assert.equal(displayOwner("optimusexe"), "optimusexe");
  assert.equal(displayOwner("a".repeat(40)).replace(/\u200b/g, "").length, 28);
});

test("urls shrink before they truncate", () => {
  const short = displayRepoUrl("vercel", "next.js");
  assert.equal(short.text, "opentip.tech/tip/vercel/next.js");
  assert.equal(short.fontSize, 22);

  const long = displayRepoUrl("microsoft", "vscode-extension-samples");
  assert.equal(long.text, "opentip.tech/tip/microsoft/vscode-extension-sampl…");
  assert.equal(long.fontSize, 16);

  const huge = displayRepoUrl("a".repeat(40), "b".repeat(80));
  assert.ok(huge.text.endsWith("…"));
  assert.equal(huge.fontSize, 16);
});

test("amounts stay at the mock size until the label gets long", () => {
  assert.equal(amountFontSize("$472.89"), 150);
  assert.equal(amountFontSize("$25.00"), 150);
  assert.equal(amountFontSize("$0.000001"), 120);
});
