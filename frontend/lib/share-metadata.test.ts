import assert from "node:assert/strict";
import test from "node:test";
import { pageShareMetadata, shareImage } from "./share-metadata.ts";

test("a repo card uses one absolute png for og and twitter", () => {
  const meta = pageShareMetadata({
    title: "vercel/next.js on Opentip",
    description: "Tip vercel/next.js on Opentip.",
    path: "/tip/vercel/next.js",
    imagePath: "/tip/vercel/next.js/opengraph-image",
    imageAlt: "Tip this repo",
  });
  const og = meta.openGraph?.images;
  const tw = meta.twitter?.images;
  assert.ok(Array.isArray(og) && Array.isArray(tw));
  const ogImage = og[0];
  const twImage = tw[0];
  assert.equal(typeof ogImage, "object");
  assert.equal(typeof twImage, "object");
  if (typeof ogImage === "string" || typeof twImage === "string") return;
  assert.equal(ogImage.url, "https://opentip.tech/tip/vercel/next.js/opengraph-image");
  assert.equal(ogImage.secureUrl, ogImage.url);
  assert.equal(twImage.url, ogImage.url);
  assert.equal(ogImage.width, 1200);
  assert.equal(ogImage.height, 630);
  assert.equal(ogImage.type, "image/png");
  assert.equal(meta.openGraph?.url, "https://opentip.tech/tip/vercel/next.js");
  assert.equal(meta.alternates?.canonical, "https://opentip.tech/tip/vercel/next.js");
  assert.equal(meta.openGraph?.title, "vercel/next.js on Opentip");
  assert.equal(meta.twitter?.title, "vercel/next.js on Opentip");
});

test("the default card is the site png, not a repo image", () => {
  const image = shareImage("/ogimage.png");
  assert.equal(image.url, "https://opentip.tech/ogimage.png");
  assert.equal(image.secureUrl, image.url);
  const home = pageShareMetadata({
    title: "Opentip | Tips for open source",
    description: "Tips for open source, from the open market.",
    path: "/",
  });
  const og = home.openGraph?.images?.[0];
  const tw = home.twitter?.images?.[0];
  assert.equal(typeof og, "object");
  assert.equal(typeof tw, "object");
  if (typeof og === "string" || typeof tw === "string" || !og || !tw) return;
  assert.equal(og.url, tw.url);
  assert.equal(home.alternates?.canonical, "https://opentip.tech");
});
