import { githubAuthTokens } from "./github-permission";
import { WORKLOG_COMMIT_CAP, WORKLOG_FIRST_WINDOW_DAYS, type WorklogSourceCommit } from "./worklog";

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

const COMMIT_PAGE_SIZE = 100;

function nextPagePath(link: string | null): string | null {
  if (!link) return null;
  for (const part of link.split(",")) {
    if (!/rel="next"/.test(part)) continue;
    const match = part.match(/<([^>]+)>/);
    if (!match) return null;
    const url = new URL(match[1]);
    return `${url.pathname}${url.search}`;
  }
  return null;
}

function commitsFromRows(rows: unknown): WorklogSourceCommit[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => mapCommit(row)).filter((row): row is WorklogSourceCommit => !!row);
}

function keepNewest(commits: WorklogSourceCommit[], oldestFirst: boolean): WorklogSourceCommit[] {
  if (commits.length <= WORKLOG_COMMIT_CAP) return commits;
  return oldestFirst ? commits.slice(commits.length - WORKLOG_COMMIT_CAP) : commits.slice(0, WORKLOG_COMMIT_CAP);
}

async function fetchCompareCommits(
  owner: string,
  repo: string,
  baseSha: string,
  headSha: string,
  tokens: string[],
): Promise<WorklogSourceCommit[] | null> {
  const commits: WorklogSourceCommit[] = [];
  const seen = new Set<string>();
  let path: string | null =
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/compare/${encodeURIComponent(baseSha)}...${encodeURIComponent(headSha)}`;
  let first = true;
  while (path && commits.length < WORKLOG_COMMIT_CAP) {
    const res = await githubGet(path, tokens);
    if (!res.ok) {
      if (first && res.status === 404) return null;
      throw new WorklogGithubError(res.status);
    }
    first = false;
    const body = await res.json();
    const batch = commitsFromRows(body?.commits);
    let added = 0;
    for (const commit of batch) {
      if (seen.has(commit.sha)) continue;
      seen.add(commit.sha);
      commits.push(commit);
      added += 1;
    }
    if (added === 0) break;
    path = nextPagePath(res.headers.get("link"));
  }
  return keepNewest(commits, true);
}

async function fetchCommitsSince(owner: string, repo: string, branch: string, tokens: string[]): Promise<WorklogSourceCommit[]> {
  const since = new Date(Date.now() - WORKLOG_FIRST_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const commits: WorklogSourceCommit[] = [];
  const seen = new Set<string>();
  for (let page = 1; commits.length < WORKLOG_COMMIT_CAP; page++) {
    const res = await githubGet(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(branch)}&since=${encodeURIComponent(since)}&per_page=${COMMIT_PAGE_SIZE}&page=${page}`,
      tokens,
    );
    if (!res.ok) throw new WorklogGithubError(res.status);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    let added = 0;
    for (const commit of commitsFromRows(batch)) {
      if (seen.has(commit.sha)) continue;
      seen.add(commit.sha);
      commits.push(commit);
      added += 1;
      if (commits.length >= WORKLOG_COMMIT_CAP) break;
    }
    if (added === 0 || batch.length < COMMIT_PAGE_SIZE) break;
  }
  return keepNewest(commits, false);
}

export async function fetchWorklogRange(
  owner: string,
  repo: string,
  baseSha: string | null,
  userToken: string | null | undefined,
): Promise<{ branch: string; head: WorklogSourceCommit; commits: WorklogSourceCommit[] }> {
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
  if (baseSha && baseSha === head.sha) return { branch, head, commits: [] as WorklogSourceCommit[] };

  if (baseSha) {
    const compared = await fetchCompareCommits(owner, repo, baseSha, head.sha, tokens);
    if (compared) return { branch, head, commits: compared };
  }

  return { branch, head, commits: await fetchCommitsSince(owner, repo, branch, tokens) };
}
