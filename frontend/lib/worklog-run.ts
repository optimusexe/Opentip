import { summarizeWorklogCommits } from "./ai";
import { prisma } from "./prisma";
import { canEditRepoIcon } from "./repo-icon-auth";
import { formatWorklogRange, subjectOf } from "./worklog";
import { fetchWorklogRange, WorklogGithubError } from "./worklog-github";

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
    cursor: cursor
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

export async function updateWorklog(repoId: string, userToken: string | null | undefined): Promise<WorklogPayload> {
  const id = repoId.toLowerCase();
  const [owner, repo] = id.split("/");
  if (!owner || !repo) throw new WorklogGithubError(400, "repoId required");
  const record = await prisma.repo.findUnique({ where: { repo_id: id }, select: { repo_id: true } });
  if (!record) throw new WorklogGithubError(404, "Repo is not registered.");

  const cursor = await prisma.worklogCursor.findUnique({ where: { repo_id: id } });
  const range = await fetchWorklogRange(owner, repo, cursor?.sha ?? null, userToken);
  const known = await prisma.worklogCommit.findMany({
    where: { entry: { repo_id: id } },
    select: { sha: true },
  });
  const knownShas = new Set(known.map((row) => row.sha));
  const freshCommits = range.commits.filter((commit) => !knownShas.has(commit.sha));
  const drafts = freshCommits.length > 0 ? await summarizeWorklogCommits(owner, repo, range.branch, freshCommits) : [];
  const toStore = drafts
    .map((draft) => ({ ...draft, commits: draft.commits.filter((commit) => !knownShas.has(commit.sha)) }))
    .filter((draft) => draft.commits.length > 0);

  let detail: string;
  let status: string;
  if (range.commits.length === 0) {
    status = "current";
    detail = `No new commits since the last update. Push or merge to ${range.branch}, then update again.`;
  } else if (toStore.length === 0) {
    status = "current";
    detail = `No user-facing changes on ${range.branch} since the last update.`;
  } else {
    status = "updated";
    detail = toStore.length === 1 ? "Added 1 entry." : `Added ${toStore.length} entries.`;
  }

  await prisma.$transaction(async (tx) => {
    for (const draft of toStore) {
      await tx.worklogEntry.create({
        data: {
          repo_id: id,
          starts_at: new Date(draft.start),
          ends_at: new Date(draft.end),
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
    await tx.worklogCursor.upsert({
      where: { repo_id: id },
      create: {
        repo_id: id,
        sha: range.head.sha.slice(0, 40),
        message: subjectOf(range.head.message).slice(0, 500),
        branch: range.branch.slice(0, 255),
        status,
        detail,
      },
      update: {
        sha: range.head.sha.slice(0, 40),
        message: subjectOf(range.head.message).slice(0, 500),
        branch: range.branch.slice(0, 255),
        status,
        detail,
      },
    });
  });

  const payload = await loadWorklog(id);
  return { ...payload, added: toStore.length };
}
