export type GithubRepoAttempt = "ok" | "not_found" | "rate_limited" | "unauthorized" | "other";

// GitHub uses 403 (and sometimes 429) when the unauthenticated 60/hour
// budget is spent. That must not be reported as a missing repo.
export function classifyGithubRepoStatus(
  status: number,
  remaining: string | null,
  message: string,
): GithubRepoAttempt {
  if (status >= 200 && status < 300) return "ok";
  const msg = message.toLowerCase();
  const limited =
    status === 429 ||
    ((status === 403 || status === 401) && (remaining === "0" || msg.includes("rate limit")));
  if (limited) return "rate_limited";
  if (status === 404) return "not_found";
  if (status === 401 || status === 403) return "unauthorized";
  return "other";
}

export function githubRetryAfterSeconds(resetHeader: string | null, nowMs = Date.now()): number {
  const reset = Number(resetHeader);
  if (!Number.isFinite(reset) || reset <= 0) return 60;
  return Math.max(1, Math.ceil(reset - nowMs / 1000));
}

// A 404 from any token is a real answer. Rate limit is only the result
// when nothing returned the repo and nothing said it was missing.
export function githubRepoFailure(
  attempts: GithubRepoAttempt[],
  retryAfterSeconds: number,
): { error: string; status: number } {
  if (attempts.includes("not_found")) return { error: "repo not found", status: 404 };
  if (attempts.includes("rate_limited")) {
    return {
      error: `GitHub rate limit exceeded, retry after ${retryAfterSeconds}s`,
      status: 429,
    };
  }
  return { error: "could not load repo from GitHub", status: 502 };
}

// User token, then server token. Unauthenticated is only the starting
// point when neither token is configured.
export function repoLookupCredentials(
  userToken: string | null | undefined,
  serverToken: string | null | undefined,
): Array<string | null> {
  const tokens: string[] = [];
  const user = userToken?.trim();
  const server = serverToken?.trim();
  if (user) tokens.push(user);
  if (server && server !== user) tokens.push(server);
  return tokens.length > 0 ? tokens : [null];
}

// After authenticated attempts fail without a 404, one unauthenticated
// lookup can still see a public repo (for example a 401 user token).
export function shouldFallbackUnauthenticated(attempts: GithubRepoAttempt[]): boolean {
  if (attempts.length === 0) return false;
  if (attempts.includes("ok") || attempts.includes("not_found")) return false;
  return true;
}
