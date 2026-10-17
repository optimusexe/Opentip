# Agent notes

## UI screenshots

UI pull requests need before and after screenshots at desktop (1440×900) and mobile (390×844). Use `.cursor/skills/verify-opentip` to launch the app, drive it, and capture those shots.

## What is already enforced

`npm run check` is the local command and the GitHub Actions command. It covers the rows that name a script.

| Rule | What enforces it |
| --- | --- |
| User-facing copy says tip, tipped, tips, or Supporters. The only fund-word exception is the hero "Funding for open source, from the open market." | `opentip/ui-copy` on `frontend/app` and `frontend/components` |
| Docs, the home page, and the root layout say OAR is coming soon when they mention OAR and tipping. Marketing names ETH and USDC. | `opentip/ui-copy` |
| Do not add an em dash under `frontend/app` or `frontend/components`. Use a period, a comma, or parentheses. | `scripts/check-added-lines.mjs` |
| Do not add raw palette utilities (`text-zinc-900` and the rest). Use `foreground`, `muted-foreground`, `brand`, `card`, or `border`. | `scripts/check-added-lines.mjs` |
| Do not import Fraunces or use `font-serif`. The toggle is `Segmented` in `frontend/components/ledger/Segmented.tsx`. | `opentip/no-serif`. `fontFamily.serif` is not in `frontend/tailwind.config.js`. `.serif` is not in `frontend/app/globals.css`. |
| A displayed repo logo goes through `resolveRepoIcon`. A directory row goes through `directoryItemForSort` in `frontend/lib/repo-icon.ts`. | `opentip/no-icon-src`, `opentip/directory-icon` |
| A wallet history row uses `historyRowKey` in `frontend/lib/history-row-key.ts`. A list item has a key. Do not add `key={i}`. | `react/jsx-key`, `scripts/check-added-lines.mjs`, `frontend/lib/history-row-key.test.ts` |
| A script that opens Prisma imports `assertLocalDb` from `scripts/assert-local-db.mjs` and calls it first. Do not run `indexer/reset.js`. | `scripts/check-local-db.mjs` |
| Build the app database with `npx prisma migrate deploy` from `frontend/prisma/migrations`. Do not use `prisma db push`. | `scripts/check-prisma-drift.mjs`, `.cursor/skills/verify-opentip/launch.sh` |
| The tip form and the home pricing card read the platform split from the chain. `SplitBar` requires `maintainerBps`. | `frontend/lib/fee-bps.ts`, `frontend/components/ledger/SplitBar.tsx` |
| Labels that docs quote live in `frontend/lib/ui-labels.ts`. Gas fallback statuses live in `frontend/lib/paymaster-fallback.ts`. | those modules, imported by the screens and the docs |
| Open Graph fonts use `new URL("./og-fonts/<file>.ttf", import.meta.url)`. | `scripts/check-og.mjs` |

## Judgment calls

Nothing fails if you skip these.

- Do not repair a layout with a negative margin. `.fluid-page-neg` is gone. Do not leave an overlay on `position: static` at mobile width. PR #11 pulled a page wider with a negative margin. PR #21 left the mobile nav static, so it covered the page. Check 390px.
- The wallet and onboarding screens may name OAR as a balance the wallet can hold. Tip marketing still says ETH and USDC, with OAR coming soon. `opentip/ui-copy` does not read wallet balances.
- An underline tab is the wrong control. Use `Segmented`. The lint names that component and does not parse every tab style.
- Frontend migrations are the schema source of truth. Do not squash the indexer history to match them. That diff drops columns.
