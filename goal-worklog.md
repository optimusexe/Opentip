# Goal: Worklog on every repo page

Status: plan only. Do not build anything until Elijah approves this file.

## What we're building

An automated **Worklog** section on every Opentip repo page. Call it Worklog everywhere: in the UI, the code and the docs. Do not call it a changelog.

## Why

A tip is a one-time gesture. A Worklog gives people a standing reason to come back to a repo page. It is also proof of work for builders: tippers, users and integrators can watch a project make progress, and maintainers get credit for steady shipping.

## Pipeline

1. **Ingestion.** A GitHub webhook fires on every push to the default branch (master or main) of a registered repo. Each push queues the commit diffs together with their commit messages.
2. **Analysis.** An orchestrated model reads each diff against the repo's recent history and Worklog. It:
   - groups related commits into one entry (for example a redesign spread over 15 commits becomes one entry),
   - applies a significance filter. It keeps changes people would notice, including small visible ones like moving a UI element. It drops noise: comment removals, docs notes about internal process, script deletions, CI setup, and merge commits.
3. **Rendering.** The entries render as a Worklog section on the repo page, newest first.

## Entry format

Each entry has:
- the date,
- a one-line summary in plain language,
- a short "why it matters" blurb,
- the raw commits, collapsed underneath, so people can expand them (each links to GitHub).

## Coming next

A "Coming next" block above the entries, filled from the repo's open pull requests or notes the maintainer writes. When there are none, the block is empty or hidden.

## Scope limits

- Public repos only for now.
- Opentip's GitHub OAuth App requests only `read:user` and `public_repo`. The compare endpoint (`GET /repos/{owner}/{repo}/compare/{base}...{head}`) and per-commit diffs need no scope on public repos, so the current permissions are enough, including for public org repos.
- Private repos are out of scope. They would need the full `repo` scope, and orgs that restrict third-party OAuth apps would block them anyway.

## Cost controls

- Cache diffs and GitHub API results so each token stays well under GitHub's limit of about 5,000 calls per hour.
- The compare endpoint returns at most 250 commits and 300 files, and very large diffs come back cut short. Handle that by working push by push and by falling back to commit messages and file lists when a diff is truncated.
- Analyze each commit once, and store the result. Reuse the same model class already used for the AI repo summary: cheap but good enough, not the cheapest possible.

## Verification (reference behavior)

A sample run on the Opentip repo itself (optimusexe/Opentip, master, Oct 10 to Oct 19 2026) turned about 45 commits into four entries:

1. **Oct 19.** Shared repo links now show the repo's own card everywhere. Why it matters: a repo posted on X, LinkedIn or Telegram shows its tips and logo, not the generic Opentip image. (PR #30)
2. **Oct 17.** Behind-the-scenes cleanup so fixes stay fixed. Why it matters: the platform fee is read straight from the contract and new databases build correctly. Groups about 20 commits from PRs #25 to #29, mostly internal guardrails.
3. **Oct 15.** Your project logo now shows everywhere, and the homepage totals tips across all repos. Groups the logo fix, the all-repos total and the display name fix. The mobile menu fix is kept as a minor visible change.
4. **Oct 12 to 13.** A fresh new look, downloadable tip receipts, and wallet token logos. Groups the Ledger redesign, receipt work, wallet restyle, tip wording and Share on X fixes (about 15 commits).

Filtered out as noise: comment removals, docs notes about agent rules, deleting the ping-db script, CI setup, the seed script safety check, and all merge commits. Coming next was empty because there were no open pull requests.

An implementation is correct when a run over the same range produces entries equivalent to these.
