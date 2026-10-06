#!/usr/bin/env node
// Verification scaffolding. Writes fixture rows into the local database
// named by DATABASE_URL. Refuses to run unless that URL points at 127.0.0.1
// or localhost, so this cannot seed a shared or production database.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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

const databaseUrl = process.env.DATABASE_URL || "";
if (!/^postgres(?:ql)?:\/\/[^@]+@(?:127\.0\.0\.1|localhost)(?::\d+)?\//.test(databaseUrl)) {
  console.error("Refusing to seed. DATABASE_URL must target 127.0.0.1 or localhost.");
  process.exit(1);
}

const prisma = new PrismaClient();

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

  console.log(`seeded ${FIXTURE_EMAIL} login=${FIXTURE_LOGIN} repo=${FIXTURE_REPO}`);
} finally {
  await prisma.$disconnect();
}
