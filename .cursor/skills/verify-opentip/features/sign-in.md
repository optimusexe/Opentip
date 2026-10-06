# Sign-in

## Sub-features

- `/signin` heading `Sign in` (`frontend/app/signin/SignInPageClient.tsx`).
- Button `Continue with GitHub`.
- Email and password fields, button `Sign in`, link `Forgot your password?`, and the switch `Create one`.
- Successful email sign-in lands on `/dashboard` (or `callbackUrl` when it is a same-origin path).

## How to get to it (user POV)

On interior pages the header shows a Sign in button linking to `/signin`. On the homepage the header link is also labeled Sign in (`frontend/components/home/HomeHeader.tsx`). The form is the email section under the divider. GitHub is the button above it.

## Driving it with Playwright

Signed-out page, both widths, via the helper:

```bash
node .cursor/skills/verify-opentip/screenshot.mjs \
  --routes /signin \
  --viewports mobile,desktop \
  --out /opt/cursor/artifacts/screenshots \
  --prefix signin
```

The signed-in result uses the shared helper, which fills the real form:

```javascript
import { launchBrowser, signIn } from "../browser.mjs";

const browser = await launchBrowser();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
page.setDefaultTimeout(60000);
await page.goto("http://127.0.0.1:3000/signin", { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Sign in" }).waitFor();
await page.getByRole("button", { name: "Continue with GitHub" }).waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/signin-mobile-form.png" });
await signIn(page);
await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/signin-mobile-dashboard.png" });
await browser.close();
```

`signIn` in `browser.mjs` does this:

```javascript
await page.getByLabel("Email").pressSequentially("verify@opentip.local");
await page.getByLabel("Password").pressSequentially("verify-opentip");
await page.locator("#main-content").getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL(/\/dashboard(?:\?|$)/);
```

End state: the URL is `/dashboard` and the heading `Profile` is visible. Match that heading with `exact: true`, because the page also has a heading `Profile picture`. The form screenshot is the step before that click. The dashboard screenshot is the result.

Use `exact: true` and scope the click to `#main-content`. The header link wraps another button named `Sign in`, so an unscoped role matches two controls. In the form, the other account action is the button `Create one`.

## Gotchas

- `locator.fill()` sets the DOM value of `components/motion/input.tsx` and does not update its React state. The form posts that state, so a filled box still sends `email=&password=` and NextAuth returns 401. Type with `pressSequentially` after `GET /api/auth/session` returns. The Sign in heading is server HTML, and typing before hydration is erased when React mounts.
- `GITHUB_ID` and `GITHUB_SECRET` are empty in the scaffolding env. `Continue with GitHub` leaves our origin and cannot complete. Do not click it for a verification shot.
- Signup posts to `/api/auth/signup` and tries to send mail through Resend. With `RESEND_API_KEY` empty that path reports a send failure. The fixture user already exists; stay on the login mode.
- `Forgot your password?` also needs Resend. Do not submit it.
- The credentials check is the real `authorize` in `frontend/lib/auth.ts` (bcrypt against `passwordHash`). Do not write a `next-auth.session-token` cookie by hand.
- `NEXTAUTH_URL` in the scaffolding file is `http://127.0.0.1:3000`. Drive the app on that host, not `localhost`, so the session cookie matches.
- A successful sign-in stores a JWT in the browser context. It does not insert a `Session` row.
