import { RepoOgCard, loadOgAssets, loadOgFonts, ogResponse } from "../lib/og-image.tsx";

const fonts = await loadOgFonts();
const assets = await loadOgAssets();
const element = RepoOgCard({
  hasTips: true,
  totalLabel: "$25.00",
  amountSize: 120,
  supporterCount: 1,
  repoName: "next.js",
  repoNameSize: 48,
  owner: "vercel",
  icon: assets.mark,
  avatar: assets.mark,
  url: "opentip.tech/vercel/next.js",
  urlSize: 22,
  mark: assets.mark,
  eth: assets.eth,
  usdc: assets.usdc,
});
const response = ogResponse(element, fonts, "check");
const bytes = new Uint8Array(await response.arrayBuffer());
const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
if (!png || bytes.length < 8) {
  console.error("Open Graph render did not return a PNG.");
  process.exit(1);
}
console.log(`og png ${bytes.length} bytes`);
