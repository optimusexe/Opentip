#!/usr/bin/env node
// Capture viewport screenshots of real routes.
//
// node .cursor/skills/verify-opentip/screenshot.mjs \
//   --routes /,/docs,/leaderboard,/repos,/vercel/next.js,/signin \
//   --viewports mobile,desktop \
//   --out /opt/cursor/artifacts/screenshots \
//   --prefix before

import fs from "node:fs";
import path from "node:path";
import { BASE_URL, accountButton, assertNoCrash, launchBrowser, parseViewport, routeSlug, signIn } from "./browser.mjs";

const READY = {
  "/": "Funding for open source",
  "/docs": "Documentation",
  "/leaderboard": "Top supporters",
  "/repos": "Repos",
  "/signin": "Sign in",
  "/vercel/next.js": "Next.js",
  "/dashboard": "Profile",
  "/notifications": "Notifications",
  "/dashboard/notifications": "Notification Settings",
};

function parseArgs(argv) {
  const options = {
    routes: [],
    viewports: ["mobile", "desktop"],
    out: "/opt/cursor/artifacts/screenshots",
    prefix: "shot",
    signIn: false,
    base: BASE_URL,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} needs a value`);
      return value;
    };
    if (arg === "--routes") options.routes = next().split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--viewports") options.viewports = next().split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--out") options.out = next();
    else if (arg === "--prefix") options.prefix = next();
    else if (arg === "--base") options.base = next().replace(/\/$/, "");
    else if (arg === "--sign-in") options.signIn = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (options.routes.length === 0) throw new Error("--routes is required");
  if (options.prefix.includes("/") || options.prefix.includes("..")) throw new Error("--prefix must be a single path segment");
  return options;
}

const options = parseArgs(process.argv);
const viewports = options.viewports.map(parseViewport);
fs.mkdirSync(options.out, { recursive: true });

const browser = await launchBrowser();
try {
  let storageState;
  if (options.signIn) {
    const context = await browser.newContext({ viewport: viewports[0] });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    await signIn(page, options.base);
    storageState = await context.storageState();
    await context.close();
  }

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      storageState,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    for (const route of options.routes) {
      const target = route.startsWith("http") ? route : `${options.base}${route.startsWith("/") ? route : `/${route}`}`;
      const pathname = new URL(target).pathname;
      await page.goto(target, { waitUntil: "domcontentloaded" });
      const needle = READY[pathname];
      if (needle) await page.getByRole("heading", { name: needle }).first().waitFor();
      if (options.signIn && pathname !== "/signin") await accountButton(page).waitFor();
      await assertNoCrash(page);
      const file = path.join(options.out, `${options.prefix}-${routeSlug(pathname)}-${viewport.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(file);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
