import { githubAuthTokens } from "./github-permission";
import {
  GITHUB_COMPARE_PAGE_SIZE,
  GITHUB_LIST_PAGE_SIZE,
  WORKLOG_COMMIT_CAP,
  commitsFromComparePages,
  compareWindow,
  takeListedCommits,
  type WorklogSourceCommit,
} from "./worklog";

export class WorklogGithubError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(
      message ??
        (status === 404
          ? "This Worklog reads public GitHub repos."
          : status === 403 || status === 429
            ? "GitHub is limiting requests right now. Try the update again in a few minutes."
            : "Could not read commits from GitHub."),
    );
    this.status = status;
  }
}

export function worklogTokens(userToken: string | null | undefined): string[] {
  return githubAuthTokens(userToken, process.env.GITHUB_TOKEN);
}

async function githubGet(path: string, tokens: string[]): Promise<Response> {
  const attempts = [...tokens, ""];
  let last: Response | null = null;
  for (const token of attempts) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "opentip",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`https://api.github.com${path}`, { headers, cache: "no-store" });
    if (res.ok || res.status === 404) return res;
    last = res;
  }
  if (!last) throw new WorklogGithubError(502);
  return last;
}

function mapCommit(row: {
  sha?: string;
  html_url?: string;
  parents?: unknown[];
  commit?: { message?: string; author?: { date?: string }; committer?: { date?: string } };
}): WorklogSourceCommit | null {
  if (!row.sha) return null;
  const message = row.commit?.message ?? "";
  const committedAt = row.commit?.author?.date || row.commit?.committer?.date;
  if (!committedAt) return null;
  return {
    sha: row.sha,
    message,
    committedAt,
    url: row.html_url || `https://github.com/commit/${row.sha}`,
    parentCount: Array.isArray(row.parents) ? row.parents.length : 1,
  };
}

export async function fetchDefaultBranch(owner: string, repo: string): Promise<string | null> {
  try {
    const res = await githubGet(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, worklogTokens(null));
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.default_branch === "string" ? data.default_branch : null;
  } catch {
    return null;
  }
}

export async function fetchOpenPullRequests(owner: string, repo: string): Promise<{ title: string; url: string }[]> {
  try {
    const res = await githubGet(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=5`,
      worklogTokens(null),
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((pr) => ({
        title: typeof pr?.title === "string" ? pr.title.trim() : "",
        url: typeof pr?.html_url === "string" ? pr.html_url : "",
      }))
      .filter((pr) => pr.title && pr.url)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function commitsFromRows(rows: unknown): WorklogSourceCommit[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => mapCommit(row)).filter((row): row is WorklogSourceCommit => !!row);
}

function comparePath(owner: string, repo: string, baseSha: string, headSha: string, page: number): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/compare/${encodeURIComponent(baseSha)}...${encodeURIComponent(headSha)}?page=${page}&per_page=${GITHUB_COMPARE_PAGE_SIZE}`;
}

async function readComparePage(
  owner: string,
  repo: string,
  baseSha: string,
  headSha: string,
  page: number,
  tokens: string[],
): Promise<{ ok: true; total: number | null; commits: WorklogSourceCommit[] } | { ok: false; status: number }> {
  const res = await githubGet(comparePath(owner, repo, baseSha, headSha, page), tokens);
  if (!res.ok) return { ok: false, status: res.status };
  const body = await res.json();
  const total = typeof body?.total_commits === "number" && Number.isFinite(body.total_commits) ? body.total_commits : null;
  return { ok: true, total, commits: commitsFromRows(body?.commits) };
}

// Compare lists oldest first and stops at 250 per response. Page 1 is read for
// total_commits, then only the pages from compareWindow are kept. Those are
// the newest 500, not the oldest 500. Commits before that window are not
// fetched again in this update.
async function fetchCompareCommits(
  owner: string,
  repo: string,
  baseSha: string,
  headSha: string,
  tokens: string[],
): Promise<{ commits: WorklogSourceCommit[]; truncated: boolean } | null> {
  const first = await readComparePage(owner, repo, baseSha, headSha, 1, tokens);
  if (!first.ok) {
    if (first.status === 404) return null;
    throw new WorklogGithubError(first.status);
  }
  const total = first.total ?? first.commits.length;
  const pages = compareWindow(total);
  const byPage = new Map<number, WorklogSourceCommit[]>();
  if (pages.includes(1)) byPage.set(1, first.commits);
  for (const page of pages) {
    if (page === 1) continue;
    const next = await readComparePage(owner, repo, baseSha, headSha, page, tokens);
    if (!next.ok) throw new WorklogGithubError(next.status);
    byPage.set(page, next.commits);
  }
  return commitsFromComparePages(byPage, total);
}

// No date window. The list is newest first, so stopping at the cap keeps the
// newest commits. stopSha, when present, is the saved cursor and is excluded.
async function fetchRecentCommits(
  owner: string,
  repo: string,
  branch: string,
  tokens: string[],
  stopSha: string | null,
): Promise<{ commits: WorklogSourceCommit[]; truncated: boolean }> {
  const pages: WorklogSourceCommit[][] = [];
  const maxPages = Math.ceil(WORKLOG_COMMIT_CAP / GITHUB_LIST_PAGE_SIZE) + 1;
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await githubGet(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(branch)}&per_page=${GITHUB_LIST_PAGE_SIZE}&page=${page}`,
      tokens,
    );
    if (!res.ok) throw new WorklogGithubError(res.status);
    const batch = commitsFromRows(await res.json());
    if (batch.length === 0) break;
    pages.push(batch);
    const taken = takeListedCommits(pages, WORKLOG_COMMIT_CAP, stopSha);
    const stopped = stopSha != null && batch.some((commit) => commit.sha === stopSha);
    if (taken.truncated || stopped || batch.length < GITHUB_LIST_PAGE_SIZE) return taken;
  }
  return takeListedCommits(pages, WORKLOG_COMMIT_CAP, stopSha);
}

export async function fetchWorklogRange(
  owner: string,
  repo: string,
  baseSha: string | null,
  userToken: string | null | undefined,
): Promise<{ branch: string; head: WorklogSourceCommit; commits: WorklogSourceCommit[]; truncated: boolean }> {
  const tokens = worklogTokens(userToken);
  const repoRes = await githubGet(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, tokens);
  if (!repoRes.ok) throw new WorklogGithubError(repoRes.status);
  const repoJson = await repoRes.json();
  const branch = typeof repoJson.default_branch === "string" ? repoJson.default_branch : "master";
  const headRes = await githubGet(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(branch)}&per_page=1`,
    tokens,
  );
  if (!headRes.ok) throw new WorklogGithubError(headRes.status);
  const headList = await headRes.json();
  const head = Array.isArray(headList) ? mapCommit(headList[0] ?? {}) : null;
  if (!head) throw new WorklogGithubError(502);
  if (baseSha && baseSha === head.sha) return { branch, head, commits: [], truncated: false };

  if (baseSha) {
    const compared = await fetchCompareCommits(owner, repo, baseSha, head.sha, tokens);
    if (compared) return { branch, head, commits: compared.commits, truncated: compared.truncated };
  }

  const recent = await fetchRecentCommits(owner, repo, branch, tokens, baseSha);
  return { branch, head, commits: recent.commits, truncated: recent.truncated };
}
