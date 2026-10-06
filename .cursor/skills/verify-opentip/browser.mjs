import fs from "node:fs";
import { chromium } from "playwright-core";
import {
  BASE_URL,
  CHROME_CANDIDATES,
  FIXTURE_EMAIL,
  FIXTURE_PASSWORD,
  VIEWPORTS,
} from "./fixture.mjs";

export function chromePath() {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `No Chrome binary found. Set CHROME_PATH. Looked in ${CHROME_CANDIDATES.join(", ")}`,
  );
}

export function parseViewport(token) {
  if (VIEWPORTS[token]) return { name: token, ...VIEWPORTS[token] };
  const match = /^(\d+)x(\d+)$/.exec(token);
  if (!match) throw new Error(`Unknown viewport "${token}". Use mobile, desktop, or WxH.`);
  return { name: token, width: Number(match[1]), height: Number(match[2]) };
}

export function routeSlug(route) {
  const pathOnly = route.split("?")[0];
  if (pathOnly === "/" || pathOnly === "") return "home";
  return pathOnly.replace(/^\/+/, "").replace(/[^\w.]+/g, "-").replace(/-+/g, "-");
}

export async function launchBrowser() {
  return chromium.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });
}

export function accountButton(page) {
  // HeaderAuth has no aria-label. With no profile image the button's
  // accessible name is "V" below the sm breakpoint (the login span is
  // `hidden sm:inline`) and "V verify" at desktop widths.
  return page.locator("header").getByRole("button", { name: /verify|^V$/ });
}

async function typeControlled(locator, value) {
  await locator.click();
  await locator.pressSequentially(value);
  const current = await locator.inputValue();
  if (current !== value) {
    throw new Error(`Controlled input held ${JSON.stringify(current)}, expected ${JSON.stringify(value)}`);
  }
}

export async function signIn(page, base = BASE_URL) {
  const sessionReady = page.waitForResponse(
    (res) => res.url().includes("/api/auth/session") && res.ok(),
    { timeout: 60000 },
  );
  await page.goto(`${base}/signin`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Sign in" }).waitFor();
  // The heading is in the server HTML. Typing before SessionProvider
  // hydrates gets wiped when React resets the controlled inputs.
  await sessionReady;
  // Input in components/motion/input.tsx is a controlled React field.
  // locator.fill() changes the DOM value and leaves React state empty, so
  // signIn("credentials") posts blank email and password. Typing does not.
  await typeControlled(page.getByLabel("Email"), FIXTURE_EMAIL);
  await typeControlled(page.getByLabel("Password"), FIXTURE_PASSWORD);
  // The header also renders a Sign in button inside its link. The form
  // submit control is the one in #main-content.
  await page.locator("#main-content").getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/dashboard(?:\?|$)/);
  await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
  return page;
}

export async function assertNoCrash(page) {
  const crashed = page.getByRole("heading", { name: "Something went wrong" });
  if (await crashed.count()) {
    throw new Error("Page hit the app error boundary (Something went wrong).");
  }
}

export { BASE_URL, VIEWPORTS };
