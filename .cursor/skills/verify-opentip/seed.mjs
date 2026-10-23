#!/usr/bin/env node
// Verification scaffolding. Writes fixture rows into the local database
// named by DATABASE_URL. Refuses to run unless that URL points at 127.0.0.1
// or localhost, so this cannot seed a shared or production database.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertLocalDb } from "../../../scripts/assert-local-db.mjs";
import {
  FIXTURE_BIO,
  FIXTURE_EMAIL,
  FIXTURE_LOGIN,
  FIXTURE_NAME,
  FIXTURE_NOTIFICATION_TITLE,
  FIXTURE_PASSWORD,
  FIXTURE_PAYOUT,
  FIXTURE_REPO,
  FIXTURE_SUMMARY,
  FIXTURE_SUPPORTER,
  FIXTURE_TIPPER,
  FIXTURE_USDC,
} from "./fixture.mjs";

assertLocalDb();

const prisma = new PrismaClient();

async function seedWorklog(prisma, repoId, entries, cursor) {
  await prisma.worklogCommit.deleteMany({ where: { entry: { repo_id: repoId } } });
  await prisma.worklogEntry.deleteMany({ where: { repo_id: repoId } });
  await prisma.worklogCursor.deleteMany({ where: { repo_id: repoId } });
  for (const entry of entries) {
    await prisma.worklogEntry.create({
      data: {
        repo_id: repoId,
        starts_at: new Date(entry.starts),
        ends_at: new Date(entry.ends),
        title: entry.title,
        why: entry.why,
        commits: {
          create: entry.commits.map(([sha, at, message], position) => ({
            sha,
            message,
            committed_at: new Date(at),
            url: `https://github.com/${repoId}/commit/${sha}`,
            position,
          })),
        },
      },
    });
  }
  await prisma.worklogCursor.create({
    data: {
      repo_id: repoId,
      sha: cursor.sha,
      message: cursor.message,
      branch: cursor.branch,
      status: "current",
      detail: `No new commits since the last update. Push or merge to ${cursor.branch}, then update again.`,
    },
  });
  await prisma.$executeRaw`UPDATE "WorklogCursor" SET updated_at = ${new Date(cursor.at)} WHERE repo_id = ${repoId}`;
}

const summary = JSON.stringify({
  description: FIXTURE_SUMMARY,
  techStack: ["TypeScript", "React"],
  features: ["App Router"],
  audience: "Developers",
});

try {
  const passwordHash = await bcrypt.hash(FIXTURE_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: FIXTURE_EMAIL },
    update: {
      name: FIXTURE_NAME,
      login: FIXTURE_LOGIN,
      passwordHash,
      emailVerified: new Date(),
      onboardingComplete: true,
    },
    create: {
      email: FIXTURE_EMAIL,
      name: FIXTURE_NAME,
      login: FIXTURE_LOGIN,
      passwordHash,
      emailVerified: new Date(),
      onboardingComplete: true,
    },
  });

  await prisma.developerProfile.upsert({
    where: { userId: user.id },
    update: { bio: FIXTURE_BIO, github: "verify" },
    create: { userId: user.id, bio: FIXTURE_BIO, github: "verify" },
  });

  await prisma.userWallet.upsert({
    where: { address: FIXTURE_PAYOUT },
    update: { userId: user.id, isPrimary: true, walletType: "eoa" },
    create: {
      userId: user.id,
      address: FIXTURE_PAYOUT,
      isPrimary: true,
      walletType: "eoa",
    },
  });

  await prisma.repo.upsert({
    where: { repo_id: FIXTURE_REPO },
    update: {
      payout_address: FIXTURE_PAYOUT,
      hidden: false,
      summary,
      summary_generated_at: new Date(),
    },
    create: {
      repo_id: FIXTURE_REPO,
      payout_address: FIXTURE_PAYOUT,
      registered_at: new Date("2026-09-01T00:00:00.000Z"),
      hidden: false,
      summary,
      summary_generated_at: new Date(),
    },
  });

  await prisma.tip.deleteMany({ where: { tx_hash: { startsWith: "0xverify" } } });
  await prisma.tip.create({
    data: {
      tipper_address: FIXTURE_TIPPER,
      repo_id: FIXTURE_REPO,
      token: FIXTURE_USDC,
      amount: "25000000",
      fee_amount: "1250000",
      timestamp: new Date("2026-09-01T12:00:00.000Z"),
      tx_hash: "0xverify0001",
      block_number: 1n,
    },
  });

  await prisma.displayName.upsert({
    where: { tipper_address: FIXTURE_TIPPER },
    update: { display_name: FIXTURE_SUPPORTER },
    create: { tipper_address: FIXTURE_TIPPER, display_name: FIXTURE_SUPPORTER },
  });

  await prisma.notification.deleteMany({ where: { ref: "verify-fixture" } });
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "tip_received",
      title: FIXTURE_NOTIFICATION_TITLE,
      body: "Verification fixture: 25 USDC tipped to vercel/next.js.",
      read: false,
      status: "sent",
      ref: "verify-fixture",
      txHash: "0xverify0000000000000000000000000000000000000000000000000000000001",
    },
  });

  await seedWorklog(prisma, FIXTURE_REPO, [
    {
      starts: "2026-10-01T00:00:00.000Z",
      ends: "2026-10-01T00:00:00.000Z",
      title: "Verification fixture entry.",
      why: "This row exists so the Worklog page renders in local checks.",
      commits: [["verify01", "2026-10-01T00:00:00.000Z", "Verification fixture commit."]],
    },
  ], {
    sha: "verify01",
    message: "Verification fixture commit.",
    branch: "canary",
    at: "2026-10-01T00:00:00.000Z",
  });

  const referenceRepo = "optimusexe/opentip";
  await prisma.repo.upsert({
    where: { repo_id: referenceRepo },
    update: {
      payout_address: FIXTURE_PAYOUT,
      hidden: false,
      icon: "/Opentip.png",
      links: JSON.stringify([
        { title: "X/Twitter", url: "https://x.com/opentip_tech" },
        { title: "Website", url: "https://opentip.tech/" },
        { title: "Documentation", url: "https://opentip.tech/tip/docs" },
      ]),
      summary: JSON.stringify({
        description: "Tips for an open-source project. A shared link shows this repo's tips and logo.",
        techStack: ["TypeScript", "Solidity"],
        features: ["Worklog"],
        audience: "Open-source maintainers",
      }),
      summary_generated_at: new Date("2026-10-19T20:12:00.000Z"),
    },
    create: {
      repo_id: referenceRepo,
      payout_address: FIXTURE_PAYOUT,
      registered_at: new Date("2026-09-01T00:00:00.000Z"),
      hidden: false,
      icon: "/Opentip.png",
      links: JSON.stringify([
        { title: "X/Twitter", url: "https://x.com/opentip_tech" },
        { title: "Website", url: "https://opentip.tech/" },
        { title: "Documentation", url: "https://opentip.tech/tip/docs" },
      ]),
      summary: JSON.stringify({
        description: "Tips for an open-source project. A shared link shows this repo's tips and logo.",
        techStack: ["TypeScript", "Solidity"],
        features: ["Worklog"],
        audience: "Open-source maintainers",
      }),
      summary_generated_at: new Date("2026-10-19T20:12:00.000Z"),
    },
  });

  await seedWorklog(prisma, referenceRepo, [
    {
      starts: "2026-10-19T10:33:02.000Z",
      ends: "2026-10-19T10:33:02.000Z",
      title: "Shared repo links now show the repo's own card everywhere.",
      why: "A repo posted on X, LinkedIn or Telegram shows its tips and logo, not the generic Opentip image.",
      commits: [["2886958", "2026-10-19T10:33:02.000Z", "fix(og): give each share card its own URL and image (#30)"]],
    },
    {
      starts: "2026-10-17T03:52:53.000Z",
      ends: "2026-10-17T07:09:59.000Z",
      title: "Behind the scenes cleanup so fixes stay fixed.",
      why: "The platform fee is read straight from the contract and new databases build correctly.",
      commits: [
        ["6b0a1da", "2026-10-17T07:09:59.000Z", "fix(og): typecheck the frontend import next build rejects"],
        ["4cf1248", "2026-10-17T04:18:32.000Z", "docs: record that the unused serif and negative-margin classes are gone"],
        ["485d16c", "2026-10-17T04:18:09.000Z", "fix(ui): remove unused serif and negative-margin classes"],
        ["4724ae2", "2026-10-17T04:10:30.000Z", "fix(og): render Open Graph cards from static font paths"],
        ["5ce0479", "2026-10-17T04:10:29.000Z", "fix(db): fail when migrations drift from the Prisma schema"],
        ["c1f90c7", "2026-10-17T04:10:27.000Z", "fix(db): require assertLocalDb before a script opens Prisma"],
        ["009f2e7", "2026-10-17T04:10:19.000Z", "fix(wallet): reject missing React keys and new index keys"],
        ["0f5031b", "2026-10-17T04:10:10.000Z", "fix(repo-icon): reject direct icon reads in the UI"],
        ["a813acb", "2026-10-17T04:09:57.000Z", "fix(ui): reject Fraunces and font-serif"],
        ["737404e", "2026-10-17T04:09:50.000Z", "fix(contrast): reject new raw palette utilities"],
        ["ee97b5e", "2026-10-17T04:09:12.000Z", "fix(copy): reject fund-words and new em dashes"],
        ["48e185e", "2026-10-17T03:55:51.000Z", "fix(repo-icon): resolve dashboard and Open Graph logos the same way"],
        ["6b34689", "2026-10-17T03:55:51.000Z", "fix(wallet): key history rows with historyRowKey"],
        ["aaf9ef7", "2026-10-17T03:55:51.000Z", "fix(db): require assertLocalDb before any script opens Prisma"],
        ["9f92993", "2026-10-17T03:55:10.000Z", "fix(copy): share the labels docs quote"],
        ["cfb96e5", "2026-10-17T03:54:04.000Z", "fix(fee): read the platform split from the chain"],
        ["bef11b7", "2026-10-17T03:52:53.000Z", "fix(db): build a fresh database from migrations"],
      ],
    },
    {
      starts: "2026-10-15T12:56:11.000Z",
      ends: "2026-10-15T16:04:43.000Z",
      title: "Your project logo now shows everywhere, and the homepage totals tips across all repos.",
      why: "Maintainers who upload a logo see it in every list and sort, and the homepage reflects the whole community.",
      commits: [
        ["64eb898", "2026-10-15T16:04:43.000Z", "Show a saved Unknown display name on the landing card."],
        ["d255fa4", "2026-10-15T14:04:06.000Z", "Show the landing card total across every visible repo."],
        ["5b4e8d0", "2026-10-15T13:05:01.000Z", "Show custom repo logos on every sort."],
        ["1562e84", "2026-10-15T12:56:11.000Z", "Keep the mobile nav panel under the header while scrolled."],
      ],
    },
    {
      starts: "2026-10-12T17:59:38.000Z",
      ends: "2026-10-13T14:26:04.000Z",
      title: "A fresh new look, downloadable tip receipts, and wallet token logos.",
      why: "Tippers get a real receipt to share, and the wallet shows clearly what you hold.",
      commits: [
        ["4a1d830", "2026-10-13T14:26:04.000Z", "Stop multi-token claims from sticking in the wallet token list. (#18)"],
        ["17df298", "2026-10-13T13:51:58.000Z", "Simplify the wallet card and add token logos. (#17)"],
        ["c6fb3e9", "2026-10-13T13:33:51.000Z", "Restyle admin and the wallet page in Ledger. (#16)"],
        ["7e4b756", "2026-10-13T05:48:23.000Z", "Open Share on X in the app on touch devices."],
        ["b65e847", "2026-10-13T05:19:29.000Z", "Show the full total on multi-token receipts."],
        ["5919d9d", "2026-10-13T04:33:05.000Z", "Open Share on X as a real link."],
        ["2d4089d", "2026-10-13T04:30:20.000Z", "Rename user-facing copy to tips."],
        ["8de28c6", "2026-10-13T04:04:04.000Z", "Restyle the remaining pages to Ledger."],
        ["3c4a714", "2026-10-12T20:11:22.000Z", "Rebuild ledger pages to the mock section structure."],
        ["7982f2d", "2026-10-12T19:59:47.000Z", "Fix receipt download so the full card saves with embedded fonts."],
        ["0dd1c6b", "2026-10-12T18:06:28.000Z", "Keep the home total renderable from the server."],
        ["3426e80", "2026-10-12T17:59:38.000Z", "Port the Ledger UI and add real tip receipts."],
      ],
    },
  ], {
    sha: "2886958",
    message: "fix(og): give each share card its own URL and image (#30)",
    branch: "master",
    at: "2026-10-19T20:12:00.000Z",
  });

  console.log(`seeded ${FIXTURE_EMAIL} login=${FIXTURE_LOGIN} repo=${FIXTURE_REPO}`);
} finally {
  await prisma.$disconnect();
}
