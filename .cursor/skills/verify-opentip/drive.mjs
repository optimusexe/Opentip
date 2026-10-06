#!/usr/bin/env node
// Drive one mapped feature through the real UI and save the action plus
// the resulting state at mobile 390x844 and desktop 1440x900.
//
// node .cursor/skills/verify-opentip/drive.mjs docs \
//   --out /opt/cursor/artifacts/screenshots \
//   --prefix proof-docs

import fs from "node:fs";
import path from "node:path";
import { BASE_URL, accountButton, assertNoCrash, launchBrowser, parseViewport, signIn } from "./browser.mjs";

function parseArgs(argv) {
  const feature = argv[2];
  if (!feature || feature.startsWith("--")) {
    throw new Error("Usage: node drive.mjs docs --out DIR --prefix NAME");
  }
  const options = {
    feature,
    out: "/opt/cursor/artifacts/screenshots",
    prefix: `proof-${feature}`,
    base: BASE_URL,
    viewports: ["mobile", "desktop"],
  };
  for (let i = 3; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} needs a value`);
      return value;
    };
    if (arg === "--out") options.out = next();
    else if (arg === "--prefix") options.prefix = next();
    else if (arg === "--base") options.base = next().replace(/\/$/, "");
    else if (arg === "--viewports") options.viewports = next().split(",").map((item) => item.trim()).filter(Boolean);
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (options.feature !== "docs") {
    throw new Error(`No driver for "${options.feature}". docs is implemented; other features are specified in features/*.md.`);
  }
  if (options.prefix.includes("/") || options.prefix.includes("..")) throw new Error("--prefix must be a single path segment");
  return options;
}

function visible(locator) {
  return locator.filter({ visible: true });
}

async function driveDocs(page, base, viewportName, out, prefix) {
  await page.goto(`${base}/docs`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Documentation" }).waitFor();
  await assertNoCrash(page);

  const loaded = path.join(out, `${prefix}-${viewportName}-loaded.png`);
  await page.screenshot({ path: loaded, fullPage: false });
  console.log(loaded);

  const picker = page.getByRole("button", { name: "Overview" });
  if (viewportName === "mobile") {
    await picker.click();
    const gettingStarted = await visible(page.getByRole("link", { name: "Getting Started", exact: true }));
    await gettingStarted.waitFor();
    await visible(page.getByRole("link", { name: "Smart Wallet", exact: true })).waitFor();
    const opened = path.join(out, `${prefix}-${viewportName}-picker-open.png`);
    await page.screenshot({ path: opened, fullPage: false });
    console.log(opened);
    await picker.click();
    await gettingStarted.waitFor({ state: "hidden" });
  } else {
    await visible(page.getByRole("link", { name: "Getting Started", exact: true })).waitFor();
    await visible(page.getByRole("link", { name: "Smart Wallet", exact: true })).waitFor();
  }

  await accountButton(page).click();
  await visible(page.getByRole("link", { name: "Dashboard" })).waitFor();
  await visible(page.getByRole("link", { name: "Profile" })).waitFor();
  await visible(page.getByRole("button", { name: "Sign out" })).waitFor();
  const menu = path.join(out, `${prefix}-${viewportName}-account-menu.png`);
  await page.screenshot({ path: menu, fullPage: false });
  console.log(menu);
}

const options = parseArgs(process.argv);
const viewports = options.viewports.map(parseViewport);
fs.mkdirSync(options.out, { recursive: true });

const browser = await launchBrowser();
try {
  const setup = await browser.newContext({ viewport: viewports[0] });
  const setupPage = await setup.newPage();
  setupPage.setDefaultTimeout(60000);
  await signIn(setupPage, options.base);
  const storageState = await setup.storageState();
  await setup.close();

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      storageState,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    await driveDocs(page, options.base, viewport.name, options.out, options.prefix);
    await context.close();
  }
} finally {
  await browser.close();
}
