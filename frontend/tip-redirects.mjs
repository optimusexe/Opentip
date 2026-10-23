// Old tipping URLs move to /tip. Redirects are permanent (308). Repo card
// images are rewrites so clients that do not follow redirects still get a 200.
// /terms and /privacy are the new product pages, so they are not in this list.
// Next keeps the query string on both redirects and rewrites.

const TIP_PREFIXES = [
  "activity",
  "admin",
  "dashboard",
  "dev",
  "docs",
  "forgot-password",
  "install",
  "leaderboard",
  "legal",
  "notifications",
  "onboarding",
  "receipt",
  "repos",
  "reset-password",
  "signin",
  "verify-email",
  "wallet",
];

// First segments that are not a GitHub owner. A two-segment public file
// (icons/icon-512.png) and the CDP rewrites stay where they are.
const RESERVED_FIRST = [
  ...TIP_PREFIXES,
  "api",
  "tip",
  "beta",
  "terms",
  "privacy",
  "_next",
  "icons",
  "tokens",
  "platform",
  ".well-known",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ownerParam = `:owner((?!(?:${RESERVED_FIRST.map(escapeRegExp).join("|")})(?:/|$))[^/]+)`;

export function legacyRedirects() {
  const rules = [];
  for (const prefix of TIP_PREFIXES) {
    rules.push({ source: `/${prefix}`, destination: `/tip/${prefix}`, permanent: true });
    rules.push({ source: `/${prefix}/:path*`, destination: `/tip/${prefix}/:path*`, permanent: true });
  }
  rules.push({
    source: `/${ownerParam}/:repo`,
    destination: "/tip/:owner/:repo",
    permanent: true,
  });
  // Image names are excluded here so the rewrites below can answer them.
  rules.push({
    source: `/${ownerParam}/:repo/:path((?!opengraph-image$|twitter-image$).+)`,
    destination: "/tip/:owner/:repo/:path",
    permanent: true,
  });
  return rules;
}

export function legacyImageRewrites() {
  return [
    {
      source: `/${ownerParam}/:repo/opengraph-image`,
      destination: "/tip/:owner/:repo/opengraph-image",
    },
    {
      source: `/${ownerParam}/:repo/twitter-image`,
      destination: "/tip/:owner/:repo/twitter-image",
    },
  ];
}

export const LEGACY_CASES = [
  ["/activity", "/tip/activity"],
  ["/admin", "/tip/admin"],
  ["/admin/users", "/tip/admin/users"],
  ["/dashboard", "/tip/dashboard"],
  ["/dashboard/account", "/tip/dashboard/account"],
  ["/dashboard/github-repos", "/tip/dashboard/github-repos"],
  ["/dashboard/wallets", "/tip/dashboard/wallets"],
  ["/dev/verify", "/tip/dev/verify"],
  ["/docs", "/tip/docs"],
  ["/docs/getting-started", "/tip/docs/getting-started"],
  ["/docs/for-developers", "/tip/docs/for-developers"],
  ["/forgot-password", "/tip/forgot-password"],
  ["/install", "/tip/install"],
  ["/leaderboard", "/tip/leaderboard"],
  ["/legal/terms", "/tip/legal/terms"],
  ["/legal/privacy", "/tip/legal/privacy"],
  ["/notifications", "/tip/notifications"],
  ["/onboarding", "/tip/onboarding"],
  ["/receipt/0xabc", "/tip/receipt/0xabc"],
  ["/repos", "/tip/repos"],
  ["/reset-password", "/tip/reset-password"],
  ["/signin", "/tip/signin"],
  ["/verify-email", "/tip/verify-email"],
  ["/wallet", "/tip/wallet"],
  ["/wallet/security", "/tip/wallet/security"],
  ["/vercel/next.js", "/tip/vercel/next.js"],
  ["/vercel/next.js/manage", "/tip/vercel/next.js/manage"],
  ["/vercel/next.js/worklog", "/tip/vercel/next.js/worklog"],
  ["/microsoft/vscode-extension-samples", "/tip/microsoft/vscode-extension-samples"],
];

export const PASSTHROUGH_PATHS = [
  "/",
  "/tip",
  "/tip/docs",
  "/tip/vercel/next.js",
  "/api/auth/session",
  "/api/account/github/callback",
  "/api/notifications/send",
  "/beta",
  "/terms",
  "/privacy",
  "/og-home.png",
  "/ogimage.png",
  "/Opentip.png",
  "/manifest.json",
  "/sw.js",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/bimi.svg",
  "/icons/icon-512.png",
  "/tokens/eth.png",
  "/tokens/usdc.png",
  "/tokens/oar.png",
  "/.well-known/jwks.json",
  "/platform/v2/evm/accounts",
  "/_next/static/chunk.js",
];
