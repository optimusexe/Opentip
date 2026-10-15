export const ALL_REPOS_LABEL = "All repos";

export type TokenSum = {
  repo_id: string;
  token: string;
  amount: string;
};

export type ToUsd = (raw: string, token: string, prices: Record<string, number>) => number;

export function hiddenRepoSet(ids: Iterable<string>): Set<string> {
  return new Set([...ids].map((id) => id.toLowerCase()));
}

export function isHiddenRepoId(repoId: string, hidden: Set<string>): boolean {
  return hidden.has(repoId.toLowerCase());
}

// Sum of USD value across every non-hidden repo. Returns null when every
// grouped row belongs to a hidden repo, so the card can stay empty.
export function visibleFundingUsd(
  rows: TokenSum[],
  hidden: Set<string>,
  prices: Record<string, number>,
  toUsd: ToUsd,
): number | null {
  let total = 0;
  let any = false;
  for (const row of rows) {
    if (isHiddenRepoId(row.repo_id, hidden)) continue;
    any = true;
    const usd = toUsd(row.amount, row.token, prices);
    total += Number.isFinite(usd) ? usd : 0;
  }
  return any ? total : null;
}

// Only a missing, blank, or whitespace-only name falls back to the address.
// Any other saved display name is shown as stored, including "Unknown".
export function isMissingTipperName(name: string | null | undefined): boolean {
  return (name?.trim() ?? "").length === 0;
}

export function shortAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function tipperLabel(name: string | null | undefined, address: string): string {
  if (name == null || isMissingTipperName(name)) return shortAddress(address);
  return name;
}

// Repo portion only, first letter capitalized. "vercel/next.js" -> "Next.js".
export function repoTipLabel(repoId: string): string {
  const name = repoId.split("/")[1] || repoId;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
