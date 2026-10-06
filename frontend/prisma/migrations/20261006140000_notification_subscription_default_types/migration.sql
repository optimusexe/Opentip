-- AlterTable
ALTER TABLE "NotificationSubscription" ALTER COLUMN "types" SET DEFAULT '["tip_received","claim_available","tip_sent","claim_submitted"]';

-- Backfill rows that only have the old empty default. An empty list saved
-- after this migration still means the user wants no pushes.
UPDATE "NotificationSubscription"
SET "types" = '["tip_received","claim_available","tip_sent","claim_submitted"]'::jsonb
WHERE "types"::text = '[]';
