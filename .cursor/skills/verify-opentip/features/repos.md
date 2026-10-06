# Repos browse

## Sub-features

- `/repos` heading `Repos` (`frontend/app/repos/page.tsx`).
- Sort buttons `Most tipped`, `Recent`, and `Most tips`.
- Search box placeholder `Search repos...`.
- A card linking to `/vercel/next.js` with the text `Next.js` and a `View` affordance.
- Empty copy `No repos registered yet.` when the `Repo` table has no visible rows.

## How to get to it (user POV)

Use the Repos link in the header. The list loads from `GET /api/repos` after the page paints, then fills GitHub avatars from `GET /api/github/meta`. Type in the search box to filter by repo id.

## Driving it with Playwright

```javascript
import { launchBrowser } from "../browser.mjs";

const browser = await launchBrowser();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
page.setDefaultTimeout(60000);
await page.goto("http://127.0.0.1:3000/repos", { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Repos" }).waitFor();
await page.getByRole("button", { name: "Most tipped" }).waitFor();
const card = page.getByRole("link", { name: /Next\.js/ });
await card.waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/repos-mobile-loaded.png" });
await page.getByPlaceholder("Search repos...").fill("next.js");
await card.waitFor();
await page.getByText("No repos registered yet.").waitFor({ state: "hidden" });
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/repos-mobile-search.png" });
await browser.close();
```

Repeat at `{ width: 1440, height: 900 }`.

End state: a link whose name includes `Next.js` is visible, and it is still visible after the search box contains `next.js`. That is the seeded `vercel/next.js` row, not the empty state.

The search input has no `<label>`. The stable handle is the placeholder `Search repos...`.

## Gotchas

- The first paint is a loader (`loading` starts true). Wait for the `Next.js` link, not only the heading.
- Sort `Most tipped` is the default. It asks the database for tip totals and then CoinGecko for ETH. The card still renders if the price request fails.
- GitHub avatars need `api.github.com`. A rate limit leaves the gray placeholder and the `Next.js` name, which comes from the repo id.
- Hidden repos are excluded by the API. The seed sets `hidden` false.
