# Opentip verification features

The web UI is `frontend/`. Launch and the shared commands are in [../SKILL.md](../SKILL.md). Fixture user: `verify@opentip.local` / `verify-opentip`, login `verify`.

| Feature | File | Proves |
| --- | --- | --- |
| Repo funding page | [repo-funding.md](repo-funding.md) | `/vercel/next.js` shows Next.js, the About summary, and either the tip form or Claim this repo |
| Docs, section picker, account menu | [docs.md](docs.md) | Mobile Overview menu and the header account menu at both widths |
| Leaderboard | [leaderboard.md](leaderboard.md) | Top supporters lists Fixture Supporter |
| Repos browse | [repos.md](repos.md) | The directory lists Next.js and search keeps that card |
| Dashboard and notifications | [dashboard-notifications.md](dashboard-notifications.md) | Profile, an unread notification, and notification settings |
| Sign-in | [sign-in.md](sign-in.md) | The email form reaches the dashboard |

`drive.mjs` implements the docs feature. The other files are the Playwright to run for that surface.
