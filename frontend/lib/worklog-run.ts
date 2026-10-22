import { randomBytes } from "node:crypto";
import { summarizeWorklogCommits } from "./ai";
import { prisma } from "./prisma";
import { canEditRepoIcon } from "./repo-icon-auth";
import {
  WORKLOG_LOCK_PLACEHOLDER_SHA,
  WORKLOG_LOCK_STALE_MS,
  dedupeWorklogDrafts,
  formatWorklogRange,
  isWorklogLease,
  isWorklogLockPlaceholder,
  planWorklogUpdate,
  subjectOf,
  type WorklogCursorTarget,
  type WorklogDraft,
} from "./worklog";
import { fetchWorklogRange, WorklogGithubError } from "./worklog-github";

export class WorklogBusyError extends Error {
  status = 409;
  constructor() {
    super("An update is already running for this repo. Try again in a few minutes.");
  }
}

function newWorklogLease(): string {
  return `updating:${randomBytes(8).toString("hex")}`;
}

type WorklogCursorSnapshot = WorklogCursorTarget & {
  status: string;
  detail: string | null;
};

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}

function restorableCursor(snapshot: {
  sha: string;
  message: string;
  branch: string;
  status: string;
  detail: string | null;
} | null): WorklogCursorSnapshot | null {
  if (!snapshot || isWorklogLockPlaceholder(snapshot.sha)) return null;
  if (isWorklogLease(snapshot.status)) {
    return { sha: snapshot.sha, message: snapshot.message, branch: snapshot.branch, status: "current", detail: null };
  }
  return snapshot;
}

// One update per repo. The claim is a single conditional update: a fresh
// `updating:` lease does not match, and a lease older than WORKLOG_LOCK_STALE_MS
// does. That is the negation of worklogLockHeld.
async function acquireWorklogLock(
  repoId: string,
  lease: string,
): Promise<{ acquired: true; previous: WorklogCursorSnapshot | null } | { acquired: false }> {
  const staleBefore = new Date(Date.now() - WORKLOG_LOCK_STALE_MS);
  let snapshot = await prisma.worklogCursor.findUnique({ where: { repo_id: repoId } });
  if (!snapshot) {
    try {
      await prisma.worklogCursor.create({
        data: {
          repo_id: repoId,
          sha: WORKLOG_LOCK_PLACEHOLDER_SHA,
          message: "",
          branch: "",
          status: lease,
          detail: "Update in progress.",
        },
      });
      return { acquired: true, previous: null };
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      snapshot = await prisma.worklogCursor.findUnique({ where: { repo_id: repoId } });
    }
  }

  const claimed = await prisma.worklogCursor.updateMany({
    where: {
      repo_id: repoId,
      OR: [{ status: { not: { startsWith: "updating:" } } }, { updated_at: { lte: staleBefore } }],
    },
    data: { status: lease, detail: "Update in progress." },
  });
  if (claimed.count !== 1) return { acquired: false };
  return { acquired: true, previous: restorableCursor(snapshot) };
}

async function releaseWorklogLock(repoId: string, lease: string, previous: WorklogCursorSnapshot | null) {
  if (!previous) {
    await prisma.worklogCursor.deleteMany({ where: { repo_id: repoId, status: lease } });
    return;
  }
  await prisma.worklogCursor.updateMany({
    where: { repo_id: repoId, status: lease },
    data: { status: previous.status, detail: previous.detail },
  });
}

export type WorklogCommitView = {
  sha: string;
  message: string;
  url: string;
  committedAt: string;
};

export type WorklogEntryView = {
  id: string;
  title: string;
  why: string;
  startsAt: string;
  endsAt: string;
  label: string;
  commits: WorklogCommitView[];
};

export type WorklogCursorView = {
  sha: string;
  message: string;
  branch: string;
  status: string;
  detail: string | null;
  updatedAt: string;
};

export type WorklogPayload = {
  entries: WorklogEntryView[];
  cursor: WorklogCursorView | null;
  added: number;
};

type SessionLike = {
  user?: object | null;
  accessToken?: string | null;
} | null;

export async function userMaintainsRepo(session: SessionLike, repoId: string): Promise<boolean> {
  const user = session?.user as { id?: string | null; login?: string | null } | null | undefined;
  const userId = user?.id;
  if (!userId) return false;
  const record = await prisma.repo.findUnique({
    where: { repo_id: repoId.toLowerCase() },
    select: { payout_address: true },
  });
  if (!record) return false;
  const wallet = await prisma.userWallet.findUnique({
    where: { address: record.payout_address },
    select: { userId: true },
  });
  return canEditRepoIcon({
    githubLogin: user?.login,
    repoId: repoId.toLowerCase(),
    sessionUserId: userId,
    payoutWalletUserId: wallet?.userId ?? null,
  });
}

export async function loadWorklog(repoId: string): Promise<WorklogPayload> {
  const id = repoId.toLowerCase();
  const [entries, cursor] = await Promise.all([
    prisma.worklogEntry.findMany({
      where: { repo_id: id },
      orderBy: { ends_at: "desc" },
      include: { commits: { orderBy: { position: "asc" } } },
    }),
    prisma.worklogCursor.findUnique({ where: { repo_id: id } }),
  ]);
  return {
    added: 0,
    cursor: cursor && !isWorklogLockPlaceholder(cursor.sha)
      ? {
          sha: cursor.sha,
          message: cursor.message,
          branch: cursor.branch,
          status: cursor.status,
          detail: cursor.detail,
          updatedAt: cursor.updated_at.toISOString(),
        }
      : null,
    entries: entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      why: entry.why,
      startsAt: entry.starts_at.toISOString(),
      endsAt: entry.ends_at.toISOString(),
      label: formatWorklogRange(entry.starts_at.toISOString(), entry.ends_at.toISOString()),
      commits: entry.commits.map((commit) => ({
        sha: commit.sha,
        message: commit.message,
        url: commit.url,
        committedAt: commit.committed_at.toISOString(),
      })),
    })),
  };
}

async function saveWorklogPlan(
  repoId: string,
  lease: string,
  drafts: WorklogDraft[],
  cursor: { sha: string; message: string; branch: string; status: string; detail: string } | null,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const shaList = drafts.flatMap((draft) => draft.commits.map((commit) => commit.sha.slice(0, 40)));
    const existing = shaList.length
      ? await tx.worklogCommit.findMany({
          where: { sha: { in: shaList }, entry: { repo_id: repoId } },
          select: { sha: true },
        })
      : [];
    const writes = dedupeWorklogDrafts(drafts, existing.map((row) => row.sha));
    for (const draft of writes) {
      const ordered = [...draft.commits].sort((a, b) => a.committedAt.localeCompare(b.committedAt));
      await tx.worklogEntry.create({
        data: {
          repo_id: repoId,
          starts_at: new Date(ordered[0].committedAt),
          ends_at: new Date(ordered[ordered.length - 1].committedAt),
          title: draft.title,
          why: draft.why,
          commits: {
            create: draft.commits.map((commit, position) => ({
              sha: commit.sha.slice(0, 40),
              message: subjectOf(commit.message).slice(0, 500),
              committed_at: new Date(commit.committedAt),
              url: commit.url,
              position,
            })),
          },
        },
      });
    }
    if (!cursor) {
      const removed = await tx.worklogCursor.deleteMany({ where: { repo_id: repoId, status: lease } });
      if (removed.count !== 1) throw new WorklogBusyError();
      return writes.length;
    }
    const updated = await tx.worklogCursor.updateMany({
      where: { repo_id: repoId, status: lease },
      data: {
        sha: cursor.sha,
        message: cursor.message,
        branch: cursor.branch,
        status: cursor.status,
        detail: cursor.detail,
      },
    });
    if (updated.count !== 1) throw new WorklogBusyError();
    return writes.length;
  });
}

export async function updateWorklog(repoId: string, userToken: string | null | undefined): Promise<WorklogPayload> {
  const id = repoId.toLowerCase();
  const [owner, repo] = id.split("/");
  if (!owner || !repo) throw new WorklogGithubError(400, "repoId required");
  const record = await prisma.repo.findUnique({ where: { repo_id: id }, select: { repo_id: true } });
  if (!record) throw new WorklogGithubError(404, "Repo is not registered.");

  const lease = newWorklogLease();
  const lock = await acquireWorklogLock(id, lease);
  if (!lock.acquired) throw new WorklogBusyError();

  try {
    const baseSha = lock.previous?.sha ?? null;
    const range = await fetchWorklogRange(owner, repo, baseSha, userToken);
    const known = await prisma.worklogCommit.findMany({
      where: { entry: { repo_id: id } },
      select: { sha: true },
    });
    const freshCommits = range.commits.filter((commit) => !known.some((row) => row.sha === commit.sha.slice(0, 40)));
    const drafts = freshCommits.length > 0 ? await summarizeWorklogCommits(owner, repo, range.branch, freshCommits) : [];
    const plan = planWorklogUpdate({
      commits: range.commits,
      knownShas: known.map((row) => row.sha),
      drafts,
      branch: range.branch,
      truncated: range.truncated,
      previous: lock.previous,
      head: range.head,
    });
    const added = await saveWorklogPlan(
      id,
      lease,
      plan.writes,
      plan.cursor ? { ...plan.cursor, status: plan.status, detail: plan.detail } : null,
    );
    const payload = await loadWorklog(id);
    return { ...payload, added };
  } catch (error) {
    await releaseWorklogLock(id, lease, lock.previous);
    throw error;
  }
}

export async function resetWorklog(repoId: string): Promise<WorklogPayload> {
  const id = repoId.toLowerCase();
  const [owner, repo] = id.split("/");
  if (!owner || !repo) throw new WorklogGithubError(400, "repoId required");
  const record = await prisma.repo.findUnique({ where: { repo_id: id }, select: { repo_id: true } });
  if (!record) throw new WorklogGithubError(404, "Repo is not registered.");

  const lease = newWorklogLease();
  const lock = await acquireWorklogLock(id, lease);
  if (!lock.acquired) throw new WorklogBusyError();

  try {
    await prisma.$transaction(async (tx) => {
      const held = await tx.worklogCursor.updateMany({
        where: { repo_id: id, status: lease },
        data: { detail: "Reset in progress." },
      });
      if (held.count !== 1) throw new WorklogBusyError();
      await tx.worklogCommit.deleteMany({ where: { entry: { repo_id: id } } });
      await tx.worklogEntry.deleteMany({ where: { repo_id: id } });
      const removed = await tx.worklogCursor.deleteMany({ where: { repo_id: id, status: lease } });
      if (removed.count !== 1) throw new WorklogBusyError();
    });
  } catch (error) {
    await releaseWorklogLock(id, lease, lock.previous);
    throw error;
  }
  return loadWorklog(id);
}
