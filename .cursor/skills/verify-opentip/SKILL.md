---
name: verify-opentip
description: Launch the Opentip Next.js web app (frontend/) and drive it in a browser at mobile 390x844 and desktop 1440x900. Use for any Opentip UI change, or any pull request that needs before and after screenshots.
---

# Verify Opentip

The surface is the Next.js App Router app in `frontend/`. It serves the public site on port 3000: home, repo funding pages (`/[owner]/[repo]`), `/docs`, `/leaderboard`, `/repos`, `/signin`, `/dashboard`, and `/notifications`. The indexer and Foundry contracts are not part of this loop.

Run every command from the repo root. The helpers live in this directory. `playwright-core` is a `frontend` devDependency and resolves from the repo `node_modules`. Chrome on this environment is `/usr/bin/google-chrome`.

## Launch

```bash
bash .cursor/skills/verify-opentip/launch.sh
```

That script:

1. Installs PostgreSQL 16 with apt if `pg_isready` is missing, then runs `sudo service postgresql start` only when `127.0.0.1:5432` is not already accepting connections.
2. Creates the local role and database `opentip` / `opentip` if they are missing.
3. Writes `frontend/.env.local` (gitignored) marked `OPENTIP_VERIFY_SCAFFOLDING`. It refuses to overwrite an `.env.local` that does not start with that marker.
4. Runs `npm install` at the repo root when `node_modules/.bin/next` is missing, then `npx prisma generate` if the client is missing.
5. Runs `npx prisma db push --skip-generate --accept-data-loss` in `frontend/`, then `node .cursor/skills/verify-opentip/seed.mjs`. `npx prisma migrate deploy` cannot build this database from empty. Migration `20261006140000_notification_subscription_default_types` runs `ALTER TABLE "NotificationSubscription"`, and that table is never created in `frontend/prisma/migrations`. `Claim`, `WalletTx`, `UserPolicy`, `Notification`, `NotificationSubscription`, and `SponsoredTx` exist in `schema.prisma` only. `db push` applies `schema.prisma` to the local verification database. Do not point it at a shared database.
6. Starts `npm run dev -- --hostname 127.0.0.1 --port 3000` in `frontend/` with `nohup`, which is `next dev --turbopack`. The npm PID is stored in `/tmp/opentip-verify/state.json`. If that PID is already alive, it is reused. If port 3000 is open and the PID is not ours, the script exits and does not kill the other process.

Ready means the script prints `READY http://127.0.0.1:3000` after `GET /docs` returns 200 and the HTML contains `Documentation`. The dev log is `/tmp/opentip-verify/next.log`.

`frontend/.env.local` contents (verification scaffolding, not production secrets):

```
DATABASE_URL=postgresql://opentip:opentip@127.0.0.1:5432/opentip
NEXTAUTH_SECRET=opentip-verify-local-only
NEXTAUTH_URL=http://127.0.0.1:3000
NEXT_PUBLIC_CHAIN=baseSepolia
NEXT_PUBLIC_CDP_PROJECT_ID=00000000-0000-4000-8000-000000000000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=00000000000000000000000000000000
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xeD13dB8234d437771e115419BF7498Ddef90Dc8D
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
RPC_URL=https://sepolia.base.org
GITHUB_ID=
GITHUB_SECRET=
RESEND_API_KEY=
GROQ_API_KEY=
```

The seed user is `verify@opentip.local` / `verify-opentip`, login `verify`, with `onboardingComplete` set so `/dashboard` renders. It also inserts repo `vercel/next.js`, one 25 USDC tip, display name `Fixture Supporter`, and a notification titled `Fixture tip received`. `seed.mjs` refuses any `DATABASE_URL` that is not on `127.0.0.1` or `localhost`.

Changing `.env.local` after the server is up requires `cleanup.sh` and then `launch.sh` again. Turbopack does not reload env files.

## Doctor

One read-only check. It does not start or stop anything.

```bash
node .cursor/skills/verify-opentip/doctor.mjs
```

It passes only when all of these are true:

- `/tmp/opentip-verify/state.json` exists, the recorded PID is alive, and that process or a child has `next` in its command line.
- Port 3000's listening socket belongs to that process tree.
- The dev log contains `Ready` or `Local:`.
- `frontend/.env.local` is the scaffolding file.
- `GET /`, `/docs`, `/leaderboard`, `/repos`, `/signin`, and `/vercel/next.js` return 200 with `Funding for open source`, `Documentation`, `Fixture Supporter`, `Repos`, `Sign in`, and `Next.js`.
- Prisma can `SELECT 1` and read a visible `vercel/next.js` row.

Exit 0 prints `doctor: healthy`.

## Drive

`drive.mjs` signs in through the email form (labels `Email` and `Password`, the `Sign in` button inside `#main-content`), lands on `/dashboard`, then drives `/docs` at both viewports. The header also has a `Sign in` button, so the form button has to be scoped. Type the email and password with `pressSequentially` after `GET /api/auth/session` returns. `fill()` does not update the controlled input in `components/motion/input.tsx`, and typing before hydration is cleared, so the credentials POST goes out empty. It uses roles, not coordinates. Chrome is launched headless with `--no-sandbox` and `--disable-dev-shm-usage`.

```bash
node .cursor/skills/verify-opentip/drive.mjs docs \
  --out /opt/cursor/artifacts/screenshots \
  --prefix proof-docs
```

Mobile is 390×844. Desktop is 1440×900. Viewports are also accepted as `390x844` and `1440x900`.

On mobile the script clicks the `Overview` button, waits until the visible `Getting Started` and `Smart Wallet` links are showing, screenshots, closes the picker, then opens the account button and waits for visible `Dashboard`, `Profile`, and `Sign out`. On desktop the section list is the sidebar (`hidden lg:block` in `frontend/app/docs/layout.tsx`); there is no `Overview` button. The account control is `header` button with accessible name `verify` at desktop and `V` below the `sm` breakpoint, because `HeaderAuth` has no aria-label and the login span is `hidden sm:inline`.

Other features are specified as runnable Playwright in `features/`. Copy those steps rather than inventing selectors.

Do not open the menu by setting React state, and do not patch `HeaderAuth` to force a session. The fixture password is the real credentials provider.

## Evidence

Same route, same signed-in or signed-out state, same viewport, on `master` and on the PR branch. Restart the dev server after checking out the other branch so the screenshot is that code.

Public pages, both widths:

```bash
node .cursor/skills/verify-opentip/screenshot.mjs \
  --routes /,/docs,/leaderboard,/repos,/vercel/next.js,/signin \
  --viewports mobile,desktop \
  --out /opt/cursor/artifacts/screenshots \
  --prefix before
```

Use `--prefix after` on the PR branch. Add `--sign-in` when the shot must show the signed-in header. Files are `{prefix}-{slug}-{viewport}.png`, viewport screenshots (`fullPage: false`), for example `before-docs-mobile.png` and `after-vercel-next.js-desktop.png`. Slug `/` is `home`.

`drive.mjs` names files `{prefix}-{viewport}-{state}.png`, for example `proof-docs-mobile-picker-open.png` and `proof-docs-desktop-account-menu.png`. Those are the action (page loaded, picker closed) and the resulting state (picker open, then account menu open).

Put files in `/opt/cursor/artifacts/screenshots`. That directory is outside the repo, so the shots are not committed. In the PR body, embed them with absolute paths:

```html
<img alt="Docs mobile, section picker open" src="/opt/cursor/artifacts/screenshots/proof-docs-mobile-picker-open.png" />
```

Proof standard: drive the control a person uses, then capture the state that control produced. Say what else changed. Signing in writes a JWT cookie in that browser context only (session strategy is JWT, so no `Session` row). The seed writes local database rows. Neither cleanup nor the browser close deletes those rows or the PNG files.

## Cleanup

```bash
bash .cursor/skills/verify-opentip/cleanup.sh
```

This sends `SIGTERM` (then `SIGKILL` if needed) to the recorded next PID and descendants found via `/proc`, and to the Postgres postmaster PID only when this launch started it and that PID's command line still contains `postgres`. It does not use `pkill`, `killall`, or a process-name match. It deletes `/tmp/opentip-verify/state.json` and leaves `/opt/cursor/artifacts` in place.

## Helpers

| File | Role |
| --- | --- |
| `launch.sh` | Postgres, env, migrate, seed, `next dev` |
| `doctor.mjs` | Read-only port, build, and database check |
| `screenshot.mjs` | Route list × viewport set → PNGs |
| `drive.mjs` | Docs feature: sign in, open the picker, open the account menu |
| `seed.mjs` | Local fixture rows |
| `fixture.mjs` | Fixture email, password, repo, viewports |
| `browser.mjs` | Chrome path, sign-in, account-button locator |
| `features/` | One file per mapped surface |

Screenshot invocation:

```bash
node .cursor/skills/verify-opentip/screenshot.mjs \
  --routes /,/docs,/leaderboard,/repos,/vercel/next.js,/signin \
  --viewports mobile,desktop \
  --out /opt/cursor/artifacts/screenshots \
  --prefix before
```

## Secrets and degraded mode

These need real secrets. Leave them unset. The stubs above are scaffolding so pages render.

| Secret | Degraded mode |
| --- | --- |
| `GITHUB_ID` / `GITHUB_SECRET` | `Continue with GitHub` is on `/signin` and fails at GitHub. Email sign-in with the fixture user works. |
| `RESEND_API_KEY` | Signup and password reset cannot send mail. Do not use those forms. The seeded user is already verified. |
| `NEXT_PUBLIC_CDP_PROJECT_ID`, `CDP_API_KEY_*`, `CDP_PAYMASTER_URL` | The stub UUID makes `CDPHooksProvider` mount, so `useCurrentUser` in `useOpentipSend` does not crash repo and wallet pages. Creating a smart wallet or submitting a tip fails at Coinbase. Do not click through a real send. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | The zero stub keeps AppKit from using a real project. `Connect wallet` does not open a usable wallet. |
| `GROQ_API_KEY` | Summaries fall back to `An open-source project by {owner}.` The seed writes a fresh summary for `vercel/next.js`, so the About tab shows `Verification fixture summary for the Next.js repository.` |
| `AZURE_STORAGE_*` | Profile and header uploads fail. Do not click the upload targets. |
| `VAPID_*` keys | `/dashboard/notifications` renders. Subscribe reports `VAPID key not configured`. |
| Owner `PRIVATE_KEY`, registrar key | Admin chain writes do not run. This skill does not cover `/admin`. |
| `GITHUB_TOKEN` | Public `api.github.com` metadata for `vercel/next.js` is unauthenticated. If it is rate-limited, the heading is still `Next.js` and the page says `Could not fetch GitHub metadata.` |

`NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT` and `https://sepolia.base.org` are public. On-chain `isRegistered` for `vercel/next.js` is usually false here, so the Tip tab shows `Claim this repo` rather than the amount form. That is the real unregistered state, not a broken page.
