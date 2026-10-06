# Repo funding page

## Sub-features

- Public funding page at `/vercel/next.js` (`frontend/app/[owner]/[repo]/page.tsx`).
- GitHub title and description when `api.github.com` answers. The visible heading is `Next.js` (`capitalize` on the repo name).
- Tip tab and About tab (`frontend/app/[owner]/[repo]/RepoTabs.tsx`).
- Seeded maintainer line `by verify` when the `Repo` row and payout wallet are present.
- About copy from the seeded summary.

## How to get to it (user POV)

From the homepage, the usual path is to open a repo from Repos, or to replace `github.com` with the Opentip host. For verification, open `/vercel/next.js` directly. The page is public. No sign-in is required to read it.

## Driving it with Playwright

```javascript
import { launchBrowser } from "../browser.mjs";

const browser = await launchBrowser();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
page.setDefaultTimeout(60000);
await page.goto("http://127.0.0.1:3000/vercel/next.js", { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Next.js" }).waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/repo-mobile-loaded.png" });
await page.getByRole("button", { name: "About" }).click();
await page.getByText("Verification fixture summary for the Next.js repository.").waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/repo-mobile-about.png" });
await browser.close();
```

Repeat with viewport `{ width: 1440, height: 900 }` and `desktop` in the file name.

End state: heading `Next.js` is visible, and the About tab shows `Verification fixture summary for the Next.js repository.` The Tip tab shows heading `Claim this repo` with `Not claimed yet` when the Base Sepolia contract reports the repo as unregistered, or heading `Tip Next.js` with an Amount field when `isRegistered` is true.

A route-only shot, without the About click:

```bash
node .cursor/skills/verify-opentip/screenshot.mjs \
  --routes /vercel/next.js \
  --viewports mobile,desktop \
  --out /opt/cursor/artifacts/screenshots \
  --prefix repo
```

## Gotchas

- `TipClient` calls `useOpentipSend`, which calls `useCurrentUser`. `launch.sh` sets `NEXT_PUBLIC_CDP_PROJECT_ID` to the stub UUID `00000000-0000-4000-8000-000000000000` so `CDPHooksProvider` mounts. With that variable unset, this page hits the error boundary `Something went wrong`. The stub does not create a wallet.
- `NEXT_PUBLIC_CHAIN=baseSepolia` and the public contract `0xeD13dB8234d437771e115419BF7498Ddef90Dc8D` make the registration read hit Base Sepolia via `https://sepolia.base.org`. `vercel/next.js` is not registered there, so the honest Tip tab is Claim this repo. Wait for that heading or for `Tip Next.js`; do not screenshot the spinner (`isRegPending`) as the final state.
- No `GROQ_API_KEY`: a missing or stale summary becomes `An open-source project by vercel.` The seed stores a fresh summary, so About shows the fixture sentence instead.
- No `GITHUB_TOKEN`: metadata is a public GitHub request. Rate limiting replaces the description with `Could not fetch GitHub metadata.` The heading `Next.js` still renders from the route.
- Do not click `Get started`, `Sign in with GitHub`, or `Connect wallet`. Those need GitHub OAuth, CDP, or a real WalletConnect project.
