import assert from "node:assert/strict";
import test from "node:test";
import {
  GITHUB_COMPARE_PAGE_SIZE,
  GITHUB_LIST_PAGE_SIZE,
  WORKLOG_COMMIT_CAP,
  WORKLOG_LOCK_STALE_MS,
  commitsFromComparePages,
  compareWindow,
  dedupeWorklogDrafts,
  draftWorklogEntries,
  entriesFromModel,
  formatWorklogDate,
  formatWorklogRange,
  formatWorklogUpdated,
  isNoiseCommit,
  parseWorklogModel,
  planWorklogUpdate,
  takeListedCommits,
  worklogLockHeld,
  worklogWriteAuth,
  type WorklogDraft,
  type WorklogSourceCommit,
} from "./worklog.ts";

// optimusexe/Opentip master, Oct 12 through Oct 19 2026. Subjects and parent
// counts are the GitHub history the reference entries were written from.
const RAW: Array<[string, string, number, string]> = [
  ["2886958", "2026-10-19T10:33:02Z", 1, "fix(og): give each share card its own URL and image (#30)"],
  ["878c159", "2026-10-17T07:15:54Z", 2, "Merge pull request #29 from optimusexe/cursor/fix-og-tsx-typecheck-87ec"],
  ["6b0a1da", "2026-10-17T07:09:59Z", 1, "fix(og): typecheck the frontend import next build rejects"],
  ["aa74633", "2026-10-17T07:00:35Z", 2, "Merge pull request #28 from optimusexe/cursor/correct-structure-72e6"],
  ["f0c0289", "2026-10-17T06:34:06Z", 2, "Merge pull request #27 from optimusexe/cursor/correct-checks-72e6"],
  ["9607e85", "2026-10-17T06:32:27Z", 2, "Merge pull request #26 from optimusexe/cursor/correct-rules-72e6"],
  ["d564c9b", "2026-10-17T06:30:16Z", 2, "Merge pull request #25 from optimusexe/cursor/correct-structure-72e6"],
  ["4cf1248", "2026-10-17T04:18:32Z", 1, "docs: record that the unused serif and negative-margin classes are gone"],
  ["71ee999", "2026-10-17T04:18:24Z", 2, "merge checks branch after comment cleanup"],
  ["61c3d64", "2026-10-17T04:18:22Z", 2, "merge structure branch after comment cleanup"],
  ["485d16c", "2026-10-17T04:18:09Z", 1, "fix(ui): remove unused serif and negative-margin classes"],
  ["e83ef12", "2026-10-17T04:18:09Z", 1, "chore: remove comments that restate the code"],
  ["6cb36a7", "2026-10-17T04:12:07Z", 1, "docs: pair each agent rule with the check that enforces it"],
  ["6cd7b66", "2026-10-17T04:10:30Z", 1, "ci: run npm run check on pull requests"],
  ["4724ae2", "2026-10-17T04:10:30Z", 1, "fix(og): render Open Graph cards from static font paths"],
  ["5ce0479", "2026-10-17T04:10:29Z", 1, "fix(db): fail when migrations drift from the Prisma schema"],
  ["c1f90c7", "2026-10-17T04:10:27Z", 1, "fix(db): require assertLocalDb before a script opens Prisma"],
  ["009f2e7", "2026-10-17T04:10:19Z", 1, "fix(wallet): reject missing React keys and new index keys"],
  ["0f5031b", "2026-10-17T04:10:10Z", 1, "fix(repo-icon): reject direct icon reads in the UI"],
  ["a813acb", "2026-10-17T04:09:57Z", 1, "fix(ui): reject Fraunces and font-serif"],
  ["737404e", "2026-10-17T04:09:50Z", 1, "fix(contrast): reject new raw palette utilities"],
  ["ee97b5e", "2026-10-17T04:09:12Z", 1, "fix(copy): reject fund-words and new em dashes"],
  ["48e185e", "2026-10-17T03:55:51Z", 1, "fix(repo-icon): resolve dashboard and Open Graph logos the same way"],
  ["6b34689", "2026-10-17T03:55:51Z", 1, "fix(wallet): key history rows with historyRowKey"],
  ["aaf9ef7", "2026-10-17T03:55:51Z", 1, "fix(db): require assertLocalDb before any script opens Prisma"],
  ["9f92993", "2026-10-17T03:55:10Z", 1, "fix(copy): share the labels docs quote"],
  ["cfb96e5", "2026-10-17T03:54:04Z", 1, "fix(fee): read the platform split from the chain"],
  ["bef11b7", "2026-10-17T03:52:53Z", 1, "fix(db): build a fresh database from migrations"],
  ["b17c6cf", "2026-10-15T16:10:26Z", 2, "Merge pull request #24 from optimusexe/cursor/show-unknown-display-name-5a75"],
  ["64eb898", "2026-10-15T16:04:43Z", 1, "Show a saved Unknown display name on the landing card."],
  ["36c6da4", "2026-10-15T14:07:41Z", 2, "Merge pull request #23 from optimusexe/cursor/all-repos-home-card-5a75"],
  ["d255fa4", "2026-10-15T14:04:06Z", 1, "Show the landing card total across every visible repo."],
  ["5a6a93c", "2026-10-15T13:35:55Z", 2, "Merge pull request #20 from optimusexe/cursor/og-card-redesign-a62f"],
  ["fc27987", "2026-10-15T13:22:00Z", 1, "Trace Open Graph fonts as static file assets."],
  ["5eaabfb", "2026-10-15T13:06:47Z", 2, "Merge pull request #22 from optimusexe/cursor/repo-icon-across-sorts-68e4"],
  ["5b4e8d0", "2026-10-15T13:05:01Z", 1, "Show custom repo logos on every sort."],
  ["8353f35", "2026-10-15T13:03:18Z", 1, "Load Open Graph fonts through a static file URL."],
  ["5fda9c9", "2026-10-15T13:00:17Z", 2, "Merge pull request #21 from optimusexe/cursor/mobile-nav-fixed-e35a"],
  ["1562e84", "2026-10-15T12:56:11Z", 1, "Keep the mobile nav panel under the header while scrolled."],
  ["81ea12d", "2026-10-15T12:55:56Z", 1, "Redraw per-repo Open Graph cards with bundled fonts."],
  ["42fd4ee", "2026-10-15T12:46:25Z", 1, "Replace the site Open Graph image with the crypto tip card."],
  ["0b56f86", "2026-10-13T18:51:05Z", 2, "Merge pull request #19 from optimusexe/cursor/db-seed-guard-f2d6"],
  ["655be0c", "2026-10-13T18:47:14Z", 1, "Refuse to seed unless DATABASE_URL is local."],
  ["d82986a", "2026-10-13T15:14:29Z", 1, "Remove ping-db script for database connectivity checks"],
  ["4a1d830", "2026-10-13T14:26:04Z", 1, "Stop multi-token claims from sticking in the wallet token list. (#18)"],
  ["17df298", "2026-10-13T13:51:58Z", 1, "Simplify the wallet card and add token logos. (#17)"],
  ["c6fb3e9", "2026-10-13T13:33:51Z", 1, "Restyle admin and the wallet page in Ledger. (#16)"],
  ["668a523", "2026-10-13T05:50:11Z", 2, "Merge pull request #15 from optimusexe/cursor/share-x-app-f2d6"],
  ["7e4b756", "2026-10-13T05:48:23Z", 1, "Open Share on X in the app on touch devices."],
  ["ec8362e", "2026-10-13T05:30:09Z", 2, "Merge pull request #14 from optimusexe/cursor/receipt-multitoken-f2d6"],
  ["b65e847", "2026-10-13T05:19:29Z", 1, "Show the full total on multi-token receipts."],
  ["56e4f22", "2026-10-13T04:34:40Z", 2, "Merge pull request #13 from optimusexe/cursor/tip-copy-f2d6"],
  ["5919d9d", "2026-10-13T04:33:05Z", 1, "Open Share on X as a real link."],
  ["2d4089d", "2026-10-13T04:30:20Z", 1, "Rename user-facing funding copy to tips."],
  ["f0de66c", "2026-10-13T04:08:31Z", 2, "Merge pull request #12 from optimusexe/cursor/ledger-remaining-f025"],
  ["8de28c6", "2026-10-13T04:04:04Z", 1, "Restyle the remaining pages to Ledger."],
  ["a6c09a9", "2026-10-13T03:08:32Z", 2, "Merge pull request #11 from optimusexe/cursor/ledger-layout-f025"],
  ["3c4a714", "2026-10-12T20:11:22Z", 1, "Rebuild ledger pages to the mock section structure."],
  ["11b272f", "2026-10-12T20:06:39Z", 2, "Merge pull request #10 from optimusexe/cursor/receipt-download-82d6"],
  ["7982f2d", "2026-10-12T19:59:47Z", 1, "Fix receipt download so the full card saves with embedded fonts."],
  ["da402a3", "2026-10-12T18:36:37Z", 2, "Merge pull request #9 from optimusexe/cursor/ledger-ui-4375"],
  ["0dd1c6b", "2026-10-12T18:06:28Z", 1, "Keep the home funding total renderable from the server."],
  ["3426e80", "2026-10-12T17:59:38Z", 1, "Port the Ledger UI and add real funding receipts."],
];

function source([sha, committedAt, parentCount, message]: [string, string, number, string]): WorklogSourceCommit {
  return {
    sha,
    committedAt,
    parentCount,
    message,
    url: `https://github.com/optimusexe/Opentip/commit/${sha}`,
  };
}

const reference = RAW.map(source);

test("noise commits from the reference window are dropped", () => {
  const dropped = reference.filter(isNoiseCommit).map((commit) => commit.sha);
  for (const sha of ["878c159", "e83ef12", "6cb36a7", "6cd7b66", "655be0c", "d82986a", "fc27987", "8353f35", "81ea12d", "42fd4ee"]) {
    assert.equal(dropped.includes(sha), true, sha);
  }
  assert.equal(isNoiseCommit(source(["4cf1248", "2026-10-17T04:18:32Z", 1, "docs: record that the unused serif and negative-margin classes are gone"])), false);
});

test("optimusexe/Opentip reference entries", () => {
  const entries = draftWorklogEntries(reference);
  assert.deepEqual(
    entries.map((entry) => [formatWorklogRange(entry.start, entry.end), entry.commits.length, entry.title, entry.why]),
    [
      [
        "Oct 19",
        1,
        "Shared repo links now show the repo's own card everywhere.",
        "A repo posted on X, LinkedIn or Telegram shows its tips and logo, not the generic Opentip image.",
      ],
      [
        "Oct 17",
        17,
        "Behind the scenes cleanup so fixes stay fixed.",
        "The platform fee is read straight from the contract and new databases build correctly.",
      ],
      [
        "Oct 15",
        4,
        "Your project logo now shows everywhere, and the homepage totals tips across all repos.",
        "Maintainers who upload a logo see it in every list and sort, and the homepage reflects the whole community.",
      ],
      [
        "Oct 12 to 13",
        12,
        "A fresh new look, downloadable tip receipts, and wallet token logos.",
        "Tippers get a real receipt to share, and the wallet shows clearly what you hold.",
      ],
    ],
  );
  assert.deepEqual(
    entries[2].commits.map((commit) => commit.sha),
    ["64eb898", "d255fa4", "5b4e8d0", "1562e84"],
  );
});

function commitAt(index: number, message = `Add feature ${index}`): WorklogSourceCommit {
  return {
    sha: index.toString(16).padStart(40, "0"),
    message,
    committedAt: new Date(Date.UTC(2024, 0, 1) + index * 60 * 1000).toISOString(),
    url: `https://github.com/acme/app/commit/${index}`,
    parentCount: 1,
  };
}

function draftFor(commits: WorklogSourceCommit[], title = "Shipped an update."): WorklogDraft {
  const ordered = [...commits].sort((a, b) => a.committedAt.localeCompare(b.committedAt));
  return {
    start: ordered[0].committedAt,
    end: ordered[ordered.length - 1].committedAt,
    title,
    why: "This shipped on the default branch.",
    commits,
  };
}

test("the commit cap keeps the newest 500", () => {
  assert.equal(WORKLOG_COMMIT_CAP, 500);
  const commits: WorklogSourceCommit[] = Array.from({ length: WORKLOG_COMMIT_CAP + 1 }, (_, index) => commitAt(index));
  const kept = draftWorklogEntries(commits).flatMap((entry) => entry.commits);
  assert.equal(kept.length, WORKLOG_COMMIT_CAP);
  assert.equal(kept.some((commit) => commit.sha === commitAt(0).sha), false);
  assert.equal(kept.some((commit) => commit.sha === commitAt(WORKLOG_COMMIT_CAP).sha), true);
});

test("compare pages keep the newest 500, not the oldest", () => {
  assert.equal(GITHUB_COMPARE_PAGE_SIZE, 250);
  assert.deepEqual(compareWindow(500), [1, 2]);
  const total = 1000;
  const pages = compareWindow(total);
  assert.deepEqual(pages, [3, 4]);
  const byPage = new Map<number, WorklogSourceCommit[]>();
  for (let page = 1; page <= 4; page += 1) {
    byPage.set(page, Array.from({ length: 250 }, (_, offset) => commitAt((page - 1) * 250 + offset)));
  }
  const selected = commitsFromComparePages(byPage, total);
  assert.equal(selected.truncated, true);
  assert.equal(selected.commits.length, 500);
  assert.equal(selected.commits.some((commit) => commit.sha === commitAt(499).sha), false);
  assert.equal(selected.commits.some((commit) => commit.sha === commitAt(500).sha), true);
  assert.equal(selected.commits[0].sha, commitAt(999).sha);
});

test("a compare window that starts mid-page still drops the older commits", () => {
  const total = 600;
  assert.deepEqual(compareWindow(total), [1, 2, 3]);
  const byPage = new Map<number, WorklogSourceCommit[]>([
    [1, Array.from({ length: 250 }, (_, offset) => commitAt(offset))],
    [2, Array.from({ length: 250 }, (_, offset) => commitAt(250 + offset))],
    [3, Array.from({ length: 100 }, (_, offset) => commitAt(500 + offset))],
  ]);
  const selected = commitsFromComparePages(byPage, total);
  assert.equal(selected.commits.length, 500);
  assert.equal(selected.commits.some((commit) => commit.sha === commitAt(99).sha), false);
  assert.equal(selected.commits.some((commit) => commit.sha === commitAt(100).sha), true);
  assert.equal(selected.commits[0].sha, commitAt(599).sha);
});

test("listed pages keep the newest 500 and can stop at the cursor", () => {
  assert.equal(GITHUB_LIST_PAGE_SIZE, 100);
  const total = 600;
  const newestFirst = Array.from({ length: total }, (_, index) => commitAt(total - 1 - index));
  const pages: WorklogSourceCommit[][] = [];
  for (let index = 0; index < newestFirst.length; index += GITHUB_LIST_PAGE_SIZE) {
    pages.push(newestFirst.slice(index, index + GITHUB_LIST_PAGE_SIZE));
  }
  const capped = takeListedCommits(pages, WORKLOG_COMMIT_CAP, null);
  assert.equal(capped.truncated, true);
  assert.equal(capped.commits.length, 500);
  assert.equal(capped.commits[0].sha, commitAt(599).sha);
  assert.equal(capped.commits.at(-1)?.sha, commitAt(100).sha);
  assert.equal(capped.commits.some((commit) => commit.sha === commitAt(99).sha), false);

  const cursor = commitAt(550).sha;
  const stopped = takeListedCommits(pages, WORKLOG_COMMIT_CAP, cursor);
  assert.equal(stopped.truncated, false);
  assert.equal(stopped.commits.some((commit) => commit.sha === cursor), false);
  assert.equal(stopped.commits[0].sha, commitAt(599).sha);
  assert.equal(stopped.commits.at(-1)?.sha, commitAt(551).sha);
});

test("the cursor stops before an unsaved commit and does not jump to head", () => {
  const commits = [commitAt(1), commitAt(2), commitAt(3), commitAt(4)];
  const head = commitAt(4);
  const partial = planWorklogUpdate({
    commits,
    knownShas: [],
    drafts: [draftFor([commits[2], commits[3]])],
    branch: "master",
    truncated: false,
    previous: { sha: "previous-sha", message: "Previous subject", branch: "master" },
    head,
  });
  assert.equal(partial.cursor?.sha, "previous-sha");
  assert.notEqual(partial.cursor?.sha, head.sha);
  assert.match(partial.detail, /does not move past them/);

  const gap = planWorklogUpdate({
    commits,
    knownShas: [],
    drafts: [draftFor([commits[0], commits[3]])],
    branch: "master",
    truncated: false,
    previous: { sha: "previous-sha", message: "Previous subject", branch: "master" },
    head,
  });
  assert.equal(gap.cursor?.sha, commits[0].sha);
  assert.notEqual(gap.cursor?.sha, head.sha);

  const noise = { ...commitAt(2), parentCount: 2, message: "Merge pull request #2" };
  const withNoise = [commitAt(1), noise, commitAt(3)];
  const covered = planWorklogUpdate({
    commits: withNoise,
    knownShas: [],
    drafts: [draftFor([withNoise[0], withNoise[2]])],
    branch: "master",
    truncated: false,
    previous: null,
    head: commitAt(9),
  });
  assert.equal(covered.cursor?.sha, withNoise[2].sha);
  assert.notEqual(covered.cursor?.sha, commitAt(9).sha);

  const done = planWorklogUpdate({
    commits,
    knownShas: [],
    drafts: [draftFor(commits)],
    branch: "master",
    truncated: true,
    previous: null,
    head,
  });
  assert.equal(done.cursor?.sha, head.sha);
  assert.match(done.detail, /Older commits were left behind/);

  const missed = planWorklogUpdate({
    commits,
    knownShas: [],
    drafts: [],
    branch: "master",
    truncated: false,
    previous: null,
    head,
  });
  assert.equal(missed.cursor, null);
});

test("saving the same sha twice keeps one commit", () => {
  const first = commitAt(1);
  const second = commitAt(2);
  const third = commitAt(3);
  const drafts = [draftFor([first, first, second]), draftFor([second, third])];
  const once = dedupeWorklogDrafts(drafts, []);
  assert.deepEqual(once.map((draft) => draft.commits.map((commit) => commit.sha)), [[first.sha, second.sha], [third.sha]]);
  const again = dedupeWorklogDrafts(once, [first.sha, third.sha]);
  assert.deepEqual(again.map((draft) => draft.commits.map((commit) => commit.sha)), [[second.sha]]);

  const replay = planWorklogUpdate({
    commits: [first, second],
    knownShas: [first.sha, second.sha],
    drafts: [draftFor([first, second])],
    branch: "master",
    truncated: false,
    previous: { sha: first.sha, message: first.message, branch: "master" },
    head: second,
  });
  assert.equal(replay.added, 0);
  assert.equal(replay.writes.length, 0);
  assert.equal(replay.cursor?.sha, second.sha);
});

test("reset uses the same owner check as update", () => {
  assert.deepEqual(worklogWriteAuth(false, false), { ok: false, status: 401, error: "not authenticated" });
  assert.deepEqual(worklogWriteAuth(false, true), { ok: false, status: 401, error: "not authenticated" });
  assert.deepEqual(worklogWriteAuth(true, false), { ok: false, status: 403, error: "not repo owner" });
  assert.deepEqual(worklogWriteAuth(true, true), { ok: true });
});

test("a fresh worklog lease blocks another update until it is stale", () => {
  const now = Date.parse("2026-10-22T12:00:00.000Z");
  assert.equal(worklogLockHeld("updating:abc", new Date(now - 1000), now), true);
  assert.equal(worklogLockHeld("updating:abc", new Date(now - WORKLOG_LOCK_STALE_MS), now), false);
  assert.equal(worklogLockHeld("current", new Date(now), now), false);
  assert.ok("updating:".length + 16 <= 32);
});

test("a date range on one month reads as Oct 12 to 13", () => {
  assert.equal(formatWorklogRange("2026-10-12T17:59:38Z", "2026-10-13T18:47:14Z"), "Oct 12 to 13");
  assert.equal(formatWorklogRange("2026-10-19T10:33:02Z", "2026-10-19T10:33:02Z"), "Oct 19");
  assert.equal(formatWorklogDate("2026-10-19T20:12:00Z"), "Oct 19, 2026");
  assert.equal(formatWorklogUpdated("2026-10-19T20:12:00Z"), "Oct 19, 2026 · 8:12 PM UTC");
});

test("model JSON becomes entries, and fund-words are dropped", () => {
  const parsed = parseWorklogModel(`{"entries":[{"title":"Shared repo links now show the repo's own card everywhere.","why":"A repo posted on X, LinkedIn or Telegram shows its tips and logo, not the generic Opentip image.","shas":["2886958"]}]}`);
  assert.ok(parsed);
  const applied = entriesFromModel(reference, parsed!);
  assert.equal(applied?.[0]?.title, "Shared repo links now show the repo's own card everywhere.");
  assert.equal(entriesFromModel(reference, [{ title: "We are funding the roadmap.", why: "More soon.", shas: ["2886958"] }]), null);
});
