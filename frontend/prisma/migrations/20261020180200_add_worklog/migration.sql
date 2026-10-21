CREATE TABLE "WorklogCursor" (
    "repo_id" TEXT NOT NULL,
    "sha" VARCHAR(40) NOT NULL,
    "message" TEXT NOT NULL,
    "branch" VARCHAR(255) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'current',
    "detail" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorklogCursor_pkey" PRIMARY KEY ("repo_id")
);

CREATE TABLE "WorklogEntry" (
    "id" TEXT NOT NULL,
    "repo_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorklogEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorklogCommit" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "sha" VARCHAR(40) NOT NULL,
    "message" TEXT NOT NULL,
    "committed_at" TIMESTAMP(3) NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorklogCommit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorklogEntry_repo_id_ends_at_idx" ON "WorklogEntry"("repo_id", "ends_at");

CREATE UNIQUE INDEX "WorklogCommit_entry_id_sha_key" ON "WorklogCommit"("entry_id", "sha");

ALTER TABLE "WorklogCursor" ADD CONSTRAINT "WorklogCursor_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "Repo"("repo_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorklogEntry" ADD CONSTRAINT "WorklogEntry_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "Repo"("repo_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorklogCommit" ADD CONSTRAINT "WorklogCommit_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "WorklogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
