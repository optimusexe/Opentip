import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BETA_FIELDS, normalizeGithubRepoUrl, parseBetaApplication, questionError } from "./beta-application.ts";

const valid = {
  name: "Ada Lovelace",
  email: "Ada@Example.com",
  githubUsername: "@ada",
  xHandle: "",
  repoUrl: "https://github.com/ada/engine.git",
  projectSummary: "A small library for notes.",
  docsReaders: "The people who install it.",
  docsTooling: "A README and a wiki.",
  docsPain: "The README goes stale after each push.",
  pushFrequency: "A few times a week.",
  monthlyPayUsd: "",
  feedbackCall: true,
};

test("twelve questions, and a valid application normalizes", () => {
  assert.equal(BETA_FIELDS.length, 12);
  const parsed = parseBetaApplication(valid);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.email, "ada@example.com");
  assert.equal(parsed.value.githubUsername, "ada");
  assert.equal(parsed.value.xHandle, null);
  assert.equal(parsed.value.repoUrl, "https://github.com/ada/engine");
  assert.equal(parsed.value.monthlyPayUsd, null);
  assert.equal(parsed.value.feedbackCall, true);
});

test("repo urls must be a github.com repository", () => {
  assert.equal(normalizeGithubRepoUrl("github.com/ada/engine/"), "https://github.com/ada/engine");
  assert.equal(normalizeGithubRepoUrl("http://www.github.com/ada/engine?tab=readme"), "https://github.com/ada/engine");
  assert.equal(normalizeGithubRepoUrl("https://gitlab.com/ada/engine"), null);
  assert.equal(normalizeGithubRepoUrl("https://github.com/ada"), null);
  assert.equal(normalizeGithubRepoUrl("https://github.com/ada/engine/issues"), null);
  assert.equal(questionError("repoUrl", "https://github.com/ada"), "Enter a github.com repository URL.");
});

test("optional handle and pay can be blank, and bad values are rejected", () => {
  assert.equal(questionError("xHandle", "  "), null);
  assert.equal(questionError("xHandle", "@opentip_tech"), null);
  assert.equal(questionError("xHandle", "this handle is way too long"), "Enter an X handle, or leave this blank.");
  assert.equal(questionError("monthlyPayUsd", ""), null);
  assert.equal(questionError("monthlyPayUsd", "12.5"), null);
  assert.equal(questionError("monthlyPayUsd", "-1"), "Enter a number, or leave this blank.");
  const paid = parseBetaApplication({ ...valid, xHandle: "@ada_l", monthlyPayUsd: "12.5" });
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  assert.equal(paid.value.xHandle, "ada_l");
  assert.equal(paid.value.monthlyPayUsd, "12.50");
});

test("email, github username, and the feedback answer are required", () => {
  assert.match(questionError("email", "ada") || "", /valid email/);
  assert.equal(questionError("githubUsername", "-ada"), "Enter your GitHub username.");
  assert.equal(questionError("feedbackCall", null), "Choose yes or no.");
  const missing = parseBetaApplication({ ...valid, feedbackCall: "yes" });
  assert.equal(missing.ok, false);
});

test("the beta client never reads the tipping database url", () => {
  const db = readFileSync(new URL("./beta-db.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/beta/route.ts", import.meta.url), "utf8");
  assert.equal(db.includes("process.env.DATABASE_URL"), false);
  assert.equal(db.includes("BETA_DATABASE_URL"), true);
  assert.equal(route.includes("process.env.DATABASE_URL"), false);
  assert.equal(route.includes("prisma"), false);
});
