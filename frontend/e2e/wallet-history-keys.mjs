// A claim that pays two tokens in one transaction used to render two history
// rows with the same React key. Toggling History back to Tokens then left the
// extra row mounted inside the token list.
//
// node frontend/e2e/wallet-history-keys.mjs

import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { launchBrowser, signIn } from "../../.cursor/skills/verify-opentip/browser.mjs";
import { FIXTURE_PAYOUT, FIXTURE_USDC } from "../../.cursor/skills/verify-opentip/fixture.mjs";
import { assertLocalDb } from "../../scripts/assert-local-db.mjs";

const BASE = process.env.OPENTIP_BASE_URL || "http://127.0.0.1:3000";
const ETH = "0x0000000000000000000000000000000000000000";
const HASH = "0x7687000000000000000000000000000000000000000000000000000000000abc";
const SHOT_DIR = process.env.WALLET_HISTORY_SHOT_DIR || "/opt/cursor/artifacts/screenshots";
const SHOTS = [
  { theme: "light", width: 1440, height: 900, file: "wallet-after-toggle-light-desktop.png" },
  { theme: "dark", width: 1440, height: 900, file: "wallet-after-toggle-dark-desktop.png" },
  { theme: "light", width: 390, height: 844, file: "wallet-after-toggle-light-mobile.png" },
  { theme: "dark", width: 390, height: 844, file: "wallet-after-toggle-dark-mobile.png" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadLocalEnv() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && process.env[match[1]] == null) process.env[match[1]] = match[2];
  }
}

async function seedTwoLegClaim(prisma) {
  await prisma.claim.deleteMany({ where: { tx_hash: HASH } });
  await prisma.claim.createMany({
    data: [
      {
        repo_id: "optimusexe/opentip",
        payout_address: FIXTURE_PAYOUT,
        token: ETH,
        amount: "9500000000000000",
        timestamp: new Date("2026-10-13T12:00:00.000Z"),
        tx_hash: HASH,
        block_number: 7687n,
      },
      {
        repo_id: "optimusexe/opentip",
        payout_address: FIXTURE_PAYOUT,
        token: FIXTURE_USDC,
        amount: "19000000",
        timestamp: new Date("2026-10-13T12:00:00.000Z"),
        tx_hash: HASH,
        block_number: 7687n,
      },
    ],
  });
}

async function toggleWallet(page, shot) {
  const duplicateKeys = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Encountered two children with the same key")) duplicateKeys.push(text);
  });
  page.setDefaultTimeout(30000);
  await page.addInitScript((theme) => localStorage.setItem("theme", theme), shot.theme);
  await page.setViewportSize({ width: shot.width, height: shot.height });
  const hydrated = page.waitForResponse(
    (res) => res.url().includes("/api/wallet/link") && res.ok(),
    { timeout: 20000 },
  );
  await page.goto(`${BASE}/wallet`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Wallet", exact: true }).waitFor();
  await hydrated;

  await page.getByRole("tab", { name: "History", exact: true }).click();
  await page.getByText("+0.0095 ETH").first().waitFor();
  await page.getByText("+19.00 USDC").first().waitFor();
  const claimed = await page.getByText("Claimed", { exact: true }).count();
  assert(claimed >= 2, `expected two claim legs in history, saw ${claimed}`);

  await page.getByRole("tab", { name: "Tokens", exact: true }).click();
  await page.getByRole("tab", { name: "Tokens", exact: true }).and(page.locator("[aria-selected='true']")).waitFor();
  await page.getByText("Ethereum", { exact: true }).waitFor();

  const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  assert(dark === (shot.theme === "dark"), `${shot.file}: expected ${shot.theme} theme`);

  const list = page.locator("div.divide-y").filter({ has: page.getByText("Ethereum", { exact: true }) });
  await list.waitFor();
  const rows = list.locator(":scope > div");
  const count = await rows.count();
  const text = await list.innerText();
  const path = `${SHOT_DIR}/${shot.file}`;
  await page.screenshot({ path });

  assert(count === 3, `token list should have exactly 3 rows after toggling, saw ${count}:\n${text}`);
  assert(/Ethereum/.test(text) && /USD Coin/.test(text) && /Oarcoin/.test(text), `token rows missing a balance:\n${text}`);
  assert(!/Claimed/i.test(text), `stale history row leaked into the token list:\n${text}`);
  assert(duplicateKeys.length === 0, `duplicate React key warning:\n${duplicateKeys.join("\n")}`);
  console.log(`${shot.file}: 3 token rows, ${shot.theme}, ${shot.width}x${shot.height}`);
}

// Fill unset vars from the local env file, then refuse a non-local URL
// before the Prisma client is loaded or constructed.
loadLocalEnv();
assertLocalDb();

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
const browser = await launchBrowser();

try {
  await seedTwoLegClaim(prisma);
  mkdirSync(SHOT_DIR, { recursive: true });
  const context = await browser.newContext();
  const sessionPage = await context.newPage();
  await signIn(sessionPage);
  await sessionPage.close();

  for (const shot of SHOTS) {
    const page = await context.newPage();
    try {
      await toggleWallet(page, shot);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  await prisma.$disconnect();
}
