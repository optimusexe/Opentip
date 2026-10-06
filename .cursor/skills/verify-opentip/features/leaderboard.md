# Leaderboard

## Sub-features

- `/leaderboard` heading `Top supporters` (`frontend/app/leaderboard/page.tsx`).
- One ranked row for the seeded tip: display name `Fixture Supporter`, total `$25.00`.
- Empty and error copy when the query fails: `No tips yet.` or `Couldn't load the leaderboard. Try again in a minute.`

## How to get to it (user POV)

Use the Leaderboard link in the header. The page is public. The ranking is lifetime USD from the `Tip` table, with display names from `DisplayName`.

## Driving it with Playwright

```javascript
import { launchBrowser } from "../browser.mjs";

const browser = await launchBrowser();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.setDefaultTimeout(60000);
await page.goto("http://127.0.0.1:3000/leaderboard", { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Top supporters" }).waitFor();
await page.getByRole("cell", { name: "Fixture Supporter" }).waitFor();
await page.getByRole("cell", { name: "$25.00" }).waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/leaderboard-desktop.png" });
await browser.close();
```

Use `{ width: 390, height: 844 }` and `leaderboard-mobile.png` for the phone shot. `screenshot.mjs --routes /leaderboard --viewports mobile,desktop` captures the same route without asserting the cells. Run the snippet when you need the assertion.

End state: the table shows `Fixture Supporter` and `$25.00`. That pair is the proof the page read the fixture tip rather than the empty state.

## Gotchas

- The tip token is Base Sepolia USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` and the amount is `25000000` base units (25 USDC). `frontend/lib/prices.ts` prices that address at $1. Switching `NEXT_PUBLIC_CHAIN` to `base` changes the USDC address and the row will not price as $25.
- The page is a server component. A database failure renders the error sentence instead of throwing. Doctor requires the supporter name in the HTML, so a connection problem fails the doctor before a screenshot.
- There is no sticky section picker here. The header account menu, after sign-in, is the top layer.
