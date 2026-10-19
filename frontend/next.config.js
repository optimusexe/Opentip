import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { HTML_LIMITED_BOT_UA_RE } = require("next/dist/shared/lib/router/utils/html-bots.js");

const projectDir = path.dirname(fileURLToPath(import.meta.url));
// The lockfile is in the repo root. Pin tracing there so local and Vercel
// bundles resolve this package the same way.
const repoRoot = path.join(projectDir, "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: repoRoot,
  // Next waits for metadata in <head> for this list. TelegramBot is not in the
  // default set, so Telegram would otherwise see a head without the card tags.
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|TelegramBot`, "i"),
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "*.blob.core.windows.net" },
    ],
  },
  transpilePackages: ["wagmi", "@wagmi/core", "@wagmi/connectors", "ox", "@coinbase/cdp-hooks", "@coinbase/cdp-core", "@coinbase/cdp-api-client"],
  // OG fonts and coins are read from disk inside the image route. Trace them
  // into the serverless bundle so production does not depend on a font CDN.
  outputFileTracingIncludes: {
    "/[owner]/[repo]/opengraph-image": [
      "./lib/og-fonts/**/*",
      "./public/mark-blue.png",
      "./public/tokens/eth.png",
      "./public/tokens/usdc.png",
    ],
    "/:owner/:repo/opengraph-image": [
      "./lib/og-fonts/**/*",
      "./public/mark-blue.png",
      "./public/tokens/eth.png",
      "./public/tokens/usdc.png",
    ],
    "/[owner]/[repo]/twitter-image": [
      "./lib/og-fonts/**/*",
      "./public/mark-blue.png",
      "./public/tokens/eth.png",
      "./public/tokens/usdc.png",
    ],
    "/:owner/:repo/twitter-image": [
      "./lib/og-fonts/**/*",
      "./public/mark-blue.png",
      "./public/tokens/eth.png",
      "./public/tokens/usdc.png",
    ],
  },
  async redirects() {
    return [
      { source: "/terms", destination: "/legal/terms", permanent: false },
      { source: "/privacy", destination: "/legal/privacy", permanent: false },
    ];
  },
  async rewrites() {
    return [
      // CDP fetches /.well-known/jwks.json server-side — dot-folders can 404/redirect
      // on some hosts, so rewrite to a plain /api route that always returns 200 JSON.
      { source: "/.well-known/jwks.json", destination: "/api/jwks" },
      // CDP SDK path constraint: its auth-exemption regexes are start-anchored
      // (^(\/platform)?\/v2\/...), so SDK traffic must live under /platform.
      // Rewritten internally to the single proxy implementation below.
      { source: "/platform/:path*", destination: "/api/cdp/:path*" },
    ];
  },
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      "@x402/evm/upto/client": "./lib/stub.ts",
      "@x402/svm/exact/client": "./lib/stub.ts",
      "@react-native-async-storage/async-storage": "./lib/stub.ts",
      "@metamask/sdk": "./lib/stub.ts",
    },
  },
  webpack: (config, { webpack }) => {
    if (!config.externals) config.externals = [];
    if (!Array.isArray(config.externals)) config.externals = [config.externals];
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /@x402\/evm\/upto\/client/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@x402\/svm\/exact\/client/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@react-native-async-storage\/async-storage/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@metamask\/sdk/ })
    );
    return config;
  },
};
export default nextConfig;
