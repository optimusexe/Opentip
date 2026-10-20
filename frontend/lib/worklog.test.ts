import assert from "node:assert/strict";
import test from "node:test";
import {
  draftWorklogEntries,
  entriesFromModel,
  formatWorklogRange,
  isNoiseCommit,
  parseWorklogModel,
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

test("a date range on one month reads as Oct 12 to 13", () => {
  assert.equal(formatWorklogRange("2026-10-12T17:59:38Z", "2026-10-13T18:47:14Z"), "Oct 12 to 13");
  assert.equal(formatWorklogRange("2026-10-19T10:33:02Z", "2026-10-19T10:33:02Z"), "Oct 19");
});

test("model JSON becomes entries, and fund-words are dropped", () => {
  const parsed = parseWorklogModel(`{"entries":[{"title":"Shared repo links now show the repo's own card everywhere.","why":"A repo posted on X, LinkedIn or Telegram shows its tips and logo, not the generic Opentip image.","shas":["2886958"]}]}`);
  assert.ok(parsed);
  const applied = entriesFromModel(reference, parsed!);
  assert.equal(applied?.[0]?.title, "Shared repo links now show the repo's own card everywhere.");
  assert.equal(entriesFromModel(reference, [{ title: "We are funding the roadmap.", why: "More soon.", shas: ["2886958"] }]), null);
});
