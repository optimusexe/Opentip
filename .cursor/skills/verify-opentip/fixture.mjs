// Verification scaffolding. These values exist only for a local Postgres
// fixture. They are not production secrets and must not be reused on a
// shared database.

export const FIXTURE_EMAIL = "verify@opentip.local";
export const FIXTURE_PASSWORD = "verify-opentip";
export const FIXTURE_LOGIN = "verify";
export const FIXTURE_NAME = "Verify Fixture";
export const FIXTURE_BIO = "Verification fixture. Not a real developer.";

// Base Sepolia USDC. launch.sh sets NEXT_PUBLIC_CHAIN=baseSepolia, and
// frontend/lib/chain.ts prices that token at $1 when no live feed overrides it.
export const FIXTURE_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const FIXTURE_TIPPER = "0x1111111111111111111111111111111111111111";
export const FIXTURE_PAYOUT = "0x2222222222222222222222222222222222222222";
export const FIXTURE_REPO = "vercel/next.js";
export const FIXTURE_SUPPORTER = "Fixture Supporter";
export const FIXTURE_SUMMARY = "Verification fixture summary for the Next.js repository.";
export const FIXTURE_NOTIFICATION_TITLE = "Fixture tip received";

export const BASE_URL = process.env.OPENTIP_BASE_URL || "http://127.0.0.1:3000";
export const PORT = 3000;

export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
};

export const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/local/bin/google-chrome",
].filter(Boolean);
