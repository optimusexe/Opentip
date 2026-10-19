import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { layoutTwitterImageProblems, repoShareCardProblems, twitterImageFileProblems } from "./check-share-cards.mjs";

const historical = `
  twitter: {
    card: "summary_large_image",
    title: "Opentip | Tips for open source",
    images: ["/ogimage.png"],
  },
`;

test("root twitter.images is rejected", () => {
  const problems = layoutTwitterImageProblems(historical);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /twitter\.images/);
});

test("a twitter-image file must re-export the open graph image", () => {
  assert.deepEqual(twitterImageFileProblems("export const runtime = 'nodejs';\n", "twitter-image.tsx").length, 1);
  assert.deepEqual(
    twitterImageFileProblems(
      'export { default, alt, size, contentType } from "./opengraph-image";\n',
      "twitter-image.tsx",
    ),
    [],
  );
});

test("the repo route pairs its open graph image with a twitter image", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  assert.deepEqual(repoShareCardProblems(root), []);
  const layout = readFileSync(`${root}/frontend/app/layout.tsx`, "utf8");
  assert.equal(layoutTwitterImageProblems(layout).length, 0);
});
