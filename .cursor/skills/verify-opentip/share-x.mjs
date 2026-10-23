// Touch Share on X tries twitter:// first, then the intent URL if the page
// stays visible. Desktop leaves the intent URL to open in a new tab.
//
// node .cursor/skills/verify-opentip/share-x.mjs

import { chromium } from "playwright-core";
import { chromePath } from "./browser.mjs";

const BASE = process.env.OPENTIP_BASE_URL || "http://127.0.0.1:3000";
const ROUTE = "/tip/receipt/0xverify0001";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectedAppUrl(intentUrl) {
  const intent = new URL(intentUrl);
  const text = intent.searchParams.get("text");
  const pageUrl = intent.searchParams.get("url");
  assert(text && pageUrl, `intent href is missing text or url: ${intentUrl}`);
  return `twitter://post?message=${encodeURIComponent(`${text} ${pageUrl}`)}`;
}

async function openReceipt(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: "domcontentloaded" });
  const link = page.getByRole("link", { name: "Share on X" });
  await link.waitFor();
  await page.getByRole("heading", { name: "Tip sent." }).waitFor();
  await page.waitForFunction(() => {
    const node = document.querySelector('a[aria-label="Share on X"]');
    return Boolean(node && node.getAttribute("href")?.startsWith("https://x.com/intent/post?"));
  });
  return { page, link };
}

async function scriptNavigations(page) {
  const client = await page.context().newCDPSession(page);
  await client.send("Page.enable");
  const events = [];
  client.on("Page.frameRequestedNavigation", (event) => {
    events.push({ url: event.url, at: Date.now(), reason: event.reason });
  });
  return events;
}

async function touchHandoff(browser, userAgent, label) {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    userAgent,
    viewport: { width: 390, height: 844 },
  });
  try {
    const { page, link } = await openReceipt(context);
    const href = await link.getAttribute("href");
    const appUrl = expectedAppUrl(href);
    assert((await link.getAttribute("target")) == null, `${label}: touch link should stay in this tab`);
    assert((await link.innerText()).includes("Share on"), `${label}: button text changed`);
    const touch = await page.evaluate(() => ({
      max: navigator.maxTouchPoints,
      coarse: window.matchMedia("(pointer: coarse)").matches,
    }));
    assert(touch.max > 0 || touch.coarse, `${label}: context is not a touch device`);

    const events = await scriptNavigations(page);
    await link.click({ noWaitAfter: true });
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      const twitter = events.find((event) => event.url.startsWith("twitter://"));
      const intent = events.find((event) => event.url.startsWith("https://x.com/intent/post"));
      if (twitter && intent) break;
      await page.waitForTimeout(50);
    }
    const twitter = events.find((event) => event.url.startsWith("twitter://"));
    const intent = events.find((event) => event.url.startsWith("https://x.com/intent/post"));
    assert(twitter, `${label}: did not set location to twitter:// (${JSON.stringify(events)})`);
    assert(intent, `${label}: did not fall back to the intent URL (${JSON.stringify(events)})`);
    assert(twitter.url === appUrl, `${label}: twitter url ${twitter.url} !== ${appUrl}`);
    assert(intent.url === href, `${label}: fallback ${intent.url} !== ${href}`);
    assert(events.indexOf(twitter) < events.indexOf(intent), `${label}: intent ran before the app scheme`);
    const gap = intent.at - twitter.at;
    assert(gap >= 1000 && gap < 2500, `${label}: fallback gap was ${gap}ms, expected ~1200ms`);
    console.log(`${label}: twitter:// then intent after ${gap}ms`);
  } finally {
    await context.close();
  }
}

async function touchCancelled(browser, eventName) {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    userAgent: IPHONE,
    viewport: { width: 390, height: 844 },
  });
  try {
    const { page, link } = await openReceipt(context);
    const events = await scriptNavigations(page);
    await link.click({ noWaitAfter: true });
    const deadline = Date.now() + 2000;
    while (!events.some((event) => event.url.startsWith("twitter://")) && Date.now() < deadline) {
      await page.waitForTimeout(20);
    }
    assert(events.some((event) => event.url.startsWith("twitter://")), `${eventName}: app scheme did not run`);
    await page.evaluate((name) => {
      const target = name === "pagehide" ? window : document;
      target.dispatchEvent(new Event(name));
    }, eventName);
    await page.waitForTimeout(1600);
    assert(
      !events.some((event) => event.url.startsWith("https://x.com/intent/post")),
      `${eventName}: intent URL opened after the timer should have been cleared`,
    );
    assert(page.url().includes(ROUTE), `${eventName}: left the receipt`);
    console.log(`${eventName}: cleared the fallback`);
  } finally {
    await context.close();
  }
}

async function desktop(browser) {
  const context = await browser.newContext({
    hasTouch: false,
    isMobile: false,
    viewport: { width: 1440, height: 900 },
  });
  try {
    const { page, link } = await openReceipt(context);
    await page.waitForFunction(() => document.querySelector('a[aria-label="Share on X"]')?.getAttribute("target") === "_blank");
    const href = await link.getAttribute("href");
    assert(href?.startsWith("https://x.com/intent/post?"), `desktop href ${href}`);
    assert((await link.getAttribute("rel"))?.includes("noopener"), "desktop link is missing noopener");
    const requested = [];
    const note = (request) => requested.push(request.url());
    context.on("request", note);
    context.on("requestfailed", note);
    const popupPromise = page.waitForEvent("popup");
    await link.click();
    const popup = await popupPromise;
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && !requested.some((url) => url.startsWith("https://x.com/"))) {
      await page.waitForTimeout(50);
    }
    const opened = requested.find((url) => url.startsWith("https://x.com/")) || popup.url();
    assert(opened.startsWith(href), `desktop opened ${opened}; popup ${popup.url()}; requests ${requested.join(" | ")}`);
    assert(!requested.some((url) => url.startsWith("twitter://")), `desktop tried the app scheme: ${requested.join(" ")}`);
    assert(page.url().includes(ROUTE), "desktop left the receipt");
    console.log(`desktop: new tab ${opened}`);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({
  executablePath: chromePath(),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  await touchHandoff(browser, IPHONE, "ios");
  await touchHandoff(browser, ANDROID, "android");
  await touchCancelled(browser, "pagehide");
  await touchCancelled(browser, "visibilitychange");
  await desktop(browser);
  console.log("share-x: ok");
} finally {
  await browser.close();
}
