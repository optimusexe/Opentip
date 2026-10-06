# Dashboard and notifications

## Sub-features

- `/dashboard` profile: heading `Profile`, public path `/dev/verify`, bio field, button `Save profile` (`frontend/app/dashboard/page.tsx`).
- Dashboard navigation: Profile, Repos, GitHub repos, Wallets, Notifications, Recent, Account (`frontend/app/dashboard/layout.tsx`).
- `/notifications`: heading `Notifications`, the seeded item `Fixture tip received`, buttons `Mark all as read` and `Clear all`.
- `/dashboard/notifications`: heading `Notification Settings`, checkbox `Tip received`, button `Enable Notifications` when the browser can ask for permission.

## How to get to it (user POV)

Sign in at `/signin` with `verify@opentip.local` / `verify-opentip`. The form sends you to `/dashboard`. The sidebar (or the phone drawer) links to Notifications, which is the in-app history at `/notifications`, and the settings page is linked as `Notification settings` from that history. The header bell (`aria-label="Notifications"`) also goes to `/notifications`, and it only renders when a session exists.

## Driving it with Playwright

```javascript
import { launchBrowser, signIn } from "../browser.mjs";

const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(60000);
await signIn(page);
await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
await page.getByText("/dev/verify").waitFor();
await page.getByPlaceholder("Tell people about yourself...").waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/dashboard-desktop-profile.png" });

await page.goto("http://127.0.0.1:3000/notifications", { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Notifications" }).waitFor();
await page.getByText("Fixture tip received").waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/notifications-desktop.png" });

await page.getByRole("link", { name: "Notification settings" }).click();
await page.getByRole("heading", { name: "Notification Settings" }).waitFor();
await page.getByRole("checkbox", { name: /Tip received/ }).waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/notifications-desktop-settings.png" });
await browser.close();
```

Mobile is the same flow at 390×844, with one extra step on `/dashboard` before leaving the page. The site header and the dashboard drawer each expose `Toggle menu`. Open the drawer with the second visible one, then follow Notifications:

```javascript
await page.getByRole("button", { name: "Toggle menu" }).nth(1).click();
await page.getByRole("link", { name: "Notifications" }).click();
```

End state: Profile shows `/dev/verify`, the history lists `Fixture tip received`, and settings shows the `Tip received` checkbox. Together those prove the session, the notification row, and the settings page.

The bio control is a `<textarea>` under the heading text `Bio`. It has no `<label for>`, so the handle is the placeholder `Tell people about yourself...`. The seeded bio is `Verification fixture. Not a real developer.` and shows up after `/api/dev/verify` returns.

## Gotchas

- The layout redirects to `/signin?callbackUrl=/dashboard` when the session is missing, and to `/onboarding` when `onboardingComplete` is false. The seed sets that flag, so the spinner should give way to Profile. Wait for the heading.
- Do not click `Save profile` unless you mean to write the bio. Do not click `Mark all as read` or `Clear all` before the screenshot; both change the fixture notification.
- Image upload posts to Azure. Without `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_KEY` it toasts a failure. Leave the upload targets alone.
- Push subscribe needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. The settings page still renders, and Subscribe would report `VAPID key not configured`. `Enable Notifications` calls the browser permission prompt; headless Chrome will not show a person a dialog you can accept. Stop at the checkbox.
- The header bell is absent until sign-in.
