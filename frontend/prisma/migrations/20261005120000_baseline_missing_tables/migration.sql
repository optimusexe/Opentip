ALTER TABLE "Repo" ADD COLUMN IF NOT EXISTS "icon" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "subAccountAddress" VARCHAR(42);
ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "walletType" VARCHAR(16) NOT NULL DEFAULT 'eoa';

CREATE TABLE IF NOT EXISTS "Claim" (
    "id" TEXT NOT NULL,
    "repo_id" TEXT NOT NULL,
    "payout_address" VARCHAR(42) NOT NULL,
    "token" VARCHAR(42) NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WalletTx" (
    "id" TEXT NOT NULL,
    "wallet" VARCHAR(42) NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "repo_id" TEXT,
    "token" VARCHAR(42),
    "amount" TEXT,
    "to_address" VARCHAR(42),
    "user_op_hash" TEXT,
    "tx_hash" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTx_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserPolicy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" VARCHAR(42),
    "pauseAll" BOOLEAN NOT NULL DEFAULT false,
    "allowArbitraryCalls" BOOLEAN NOT NULL DEFAULT true,
    "dailyLimitUsd" DECIMAL(12,2) NOT NULL DEFAULT 1000,
    "dailyLimitEnabled" BOOLEAN NOT NULL DEFAULT true,
    "perTxLimitUsd" DECIMAL(12,2) NOT NULL DEFAULT 500,
    "perTxLimitEnabled" BOOLEAN NOT NULL DEFAULT true,
    "permittedRecipientsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "permittedRecipients" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NotificationSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256Key" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "types" JSONB NOT NULL DEFAULT '["tip_received","claim_available","tip_sent","claim_submitted"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "txHash" VARCHAR(66),
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SponsoredTx" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userOpHash" TEXT,
    "txHash" TEXT,
    "kind" VARCHAR(16) NOT NULL,
    "gasWei" TEXT,
    "gasUsd" DECIMAL(12,2),
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsoredTx_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Claim_repo_id_idx" ON "Claim"("repo_id");
CREATE INDEX IF NOT EXISTS "Claim_payout_address_idx" ON "Claim"("payout_address");
CREATE INDEX IF NOT EXISTS "Claim_token_idx" ON "Claim"("token");
CREATE INDEX IF NOT EXISTS "Claim_timestamp_idx" ON "Claim"("timestamp");

CREATE UNIQUE INDEX IF NOT EXISTS "WalletTx_user_op_hash_key" ON "WalletTx"("user_op_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "WalletTx_tx_hash_key" ON "WalletTx"("tx_hash");
CREATE INDEX IF NOT EXISTS "WalletTx_wallet_idx" ON "WalletTx"("wallet");
CREATE INDEX IF NOT EXISTS "WalletTx_tx_hash_idx" ON "WalletTx"("tx_hash");
CREATE INDEX IF NOT EXISTS "WalletTx_user_op_hash_idx" ON "WalletTx"("user_op_hash");

CREATE UNIQUE INDEX IF NOT EXISTS "UserPolicy_userId_key" ON "UserPolicy"("userId");

CREATE INDEX IF NOT EXISTS "NotificationSubscription_userId_idx" ON "NotificationSubscription"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationSubscription_userId_endpoint_key" ON "NotificationSubscription"("userId", "endpoint");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_status_idx" ON "Notification"("status");
CREATE INDEX IF NOT EXISTS "Notification_ref_idx" ON "Notification"("ref");

CREATE UNIQUE INDEX IF NOT EXISTS "SponsoredTx_userOpHash_key" ON "SponsoredTx"("userOpHash");
CREATE UNIQUE INDEX IF NOT EXISTS "SponsoredTx_txHash_key" ON "SponsoredTx"("txHash");
CREATE INDEX IF NOT EXISTS "SponsoredTx_userId_idx" ON "SponsoredTx"("userId");
CREATE INDEX IF NOT EXISTS "SponsoredTx_status_idx" ON "SponsoredTx"("status");
CREATE INDEX IF NOT EXISTS "SponsoredTx_createdAt_idx" ON "SponsoredTx"("createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserPolicy_userId_fkey') THEN
    ALTER TABLE "UserPolicy" ADD CONSTRAINT "UserPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NotificationSubscription_userId_fkey') THEN
    ALTER TABLE "NotificationSubscription" ADD CONSTRAINT "NotificationSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SponsoredTx_userId_fkey') THEN
    ALTER TABLE "SponsoredTx" ADD CONSTRAINT "SponsoredTx_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
