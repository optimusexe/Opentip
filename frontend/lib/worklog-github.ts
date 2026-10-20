import { githubAuthTokens } from "./github-permission";
import { WORKLOG_FIRST_WINDOW_DAYS, type WorklogSourceCommit } from "./worklog";

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
    const compare = await githubGet(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/compare/${encodeURIComponent(baseSha)}...${encodeURIComponent(head.sha)}`,
      tokens,
    );
    if (compare.ok) {
      const body = await compare.json();
      const commits = Array.isArray(body.commits)
        ? body.commits.map((row: Parameters<typeof mapCommit>[0]) => mapCommit(row)).filter((row: WorklogSourceCommit | null): row is WorklogSourceCommit => !!row)
        : [];
      return { branch, head, commits };
    }
    if (compare.status !== 404) throw new WorklogGithubError(compare.status);
  }

  const since = new Date(Date.now() - WORKLOG_FIRST_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const commits: WorklogSourceCommit[] = [];
  for (let page = 1; page <= 3; page++) {
    const res = await githubGet(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(branch)}&since=${encodeURIComponent(since)}&per_page=100&page=${page}`,
      tokens,
    );
    if (!res.ok) throw new WorklogGithubError(res.status);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const row of batch) {
      const commit = mapCommit(row);
      if (commit) commits.push(commit);
    }
    if (batch.length < 100) break;
  }
  return { branch, head, commits };
}
