export type GithubRepo = {
  owner: string;
  repo: string;
};

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

export function parseGithubRepo(input: string): GithubRepo | null {
  let value = input.trim();
  if (!value) return null;

  value = value.replace(/^https?:\/\//i, "");
  value = value.replace(/^www\./i, "");

  if (/^github\.com(?:[/?#]|$)/i.test(value)) {
    value = value.replace(/^github\.com\/?/i, "");
  } else if (/github\.com/i.test(value)) {
    return null;
  }

  value = value.split(/[?#]/)[0] ?? "";
  value = value.replace(/\/+$/, "");
  value = value.replace(/\.git$/i, "");

  if (!value || /[\s\\]/.test(value)) return null;

  const parts = value.split("/");
  if (parts.length !== 2) return null;

  const [owner, repo] = parts;
  if (!owner || !repo || !isOwner(owner) || !isRepo(repo)) return null;

  return { owner, repo };
}

export function fundingPath(repo: GithubRepo): string {
  return `/tip/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
}

function isOwner(value: string): boolean {
  return OWNER_RE.test(value) && !value.includes("--");
}

function isRepo(value: string): boolean {
  if (!REPO_RE.test(value)) return false;
  if (value === "." || value === "..") return false;
  if (value.startsWith("-") || value.endsWith(".")) return false;
  if (value.includes("..")) return false;
  return true;
}
