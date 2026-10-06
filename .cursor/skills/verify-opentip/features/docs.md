# Docs, section picker, and account menu

## Sub-features

- Docs overview at `/docs`, heading `Documentation`.
- Mobile section picker: the sticky `Overview` button in `frontend/app/docs/layout.tsx` (`lg:hidden`). Opening it shows the section links.
- Desktop section list: the sidebar (`hidden lg:block`) with the same links.
- Header account menu from `frontend/components/HeaderAuth.tsx`: Profile, Dashboard, Wallet, Security, Account, Sign out.

## How to get to it (user POV)

Sign in from `/signin` with email `verify@opentip.local` and password `verify-opentip`. The app lands on `/dashboard`. Open Docs in the header (or go to `/docs`). On a phone, tap the bar labeled Overview to change sections. Tap the avatar letter V to open the account menu. On a wide screen the sections are the left sidebar, and the account control shows the name verify.

## Driving it with Playwright

Executable form, both viewports:

```bash
node .cursor/skills/verify-opentip/drive.mjs docs \
  --out /opt/cursor/artifacts/screenshots \
  --prefix proof-docs
```

The script signs in through the form, then for each viewport:

1. Opens `http://127.0.0.1:3000/docs` and waits for heading `Documentation`. Screenshot `{prefix}-{viewport}-loaded.png`.
2. Mobile only: clicks button `Overview`, waits for a visible link `Getting Started` and a visible link `Smart Wallet`, screenshots `{prefix}-mobile-picker-open.png`, then clicks `Overview` again and waits until that link is hidden.
3. Desktop: waits for the visible sidebar links `Getting Started` and `Smart Wallet` (no Overview button at 1440px).
4. Clicks the header button named `verify` or `V`, waits for visible link `Dashboard`, link `Profile`, and button `Sign out`, screenshots `{prefix}-{viewport}-account-menu.png`.

End state: the account menu is open and Sign out is visible. On mobile, the picker screenshot shows Getting Started. On desktop, the loaded screenshot shows the sidebar.

The account locator, because the avatar button has no aria-label:

```javascript
page.locator("header").getByRole("button", { name: /verify|^V$/ })
```

Visible links only, because the desktop sidebar and the mobile list are both in the DOM:

```javascript
page.getByRole("link", { name: "Getting Started", exact: true }).filter({ visible: true })
```

## Gotchas

- The overview article repeats those section names inside longer card links (`Getting Started How to tip a...`). Use `exact: true` so the picker link is the one whose name is only `Getting Started`.
- Below `sm` (640px) the login text is `hidden sm:inline`, so the accessible name is the letter `V`. At 1440px it is `V verify`.
- The header hamburger is `aria-label="Toggle menu"`. Do not click that when you want the account menu.
- On current master the docs picker and the header are both `z-10`. The picker is later in the tree, so an open Overview bar can paint over the account menu. Close the picker before opening the menu, or the menu shot shows the overlap. That stacking bug is what PR #7 changes; do not patch `HeaderAuth` to hide it.
- `drive.mjs` signs in first. A signed-out header has a Sign in control, not the account menu.
- Signing in sets a JWT cookie in the browser context only.
