// One icon for every list: a project logo uploaded in repo settings, then the
// developer's picture, then the repo name's first letter.

export type ResolvedRepoIcon =
  | { kind: "image"; src: string }
  | { kind: "letter"; letter: string };

export function normalizeRepoIcon(icon: string | null | undefined): string | null {
  if (typeof icon !== "string") return null;
  const trimmed = icon.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveRepoIcon(input: {
  logo?: string | null;
  developerPfp?: string | null;
  name?: string | null;
}): ResolvedRepoIcon {
  const logo = normalizeRepoIcon(input.logo);
  if (logo) return { kind: "image", src: logo };
  const developerPfp = normalizeRepoIcon(input.developerPfp);
  if (developerPfp) return { kind: "image", src: developerPfp };
  const name = input.name?.trim() ?? "";
  const letter = name.charAt(0).toUpperCase();
  return { kind: "letter", letter: letter || "?" };
}

export type DirectoryRepoSource = {
  repo_id: string;
  payout_address: string;
  registered_at: Date | string;
  icon?: string | null;
};

export type DirectoryRepoStats = {
  total_tipped: string;
  tip_count: number;
  tipped_usd?: number;
};

export type DirectoryRepoItem = {
  repo_id: string;
  payout_address: string;
  registered_at: Date | string;
  total_tipped: string;
  tip_count: number;
  tipped_usd?: number;
  icon: string | null;
};

export type DirectorySort = "recent" | "tipped" | "tips";

// Every sort, and search (a filter on the same items), copies the logo through
// this function. Recently registered used to build its own object and drop it.
export function directoryItemForSort(
  repo: DirectoryRepoSource,
  sort: DirectorySort,
  stats: DirectoryRepoStats,
): DirectoryRepoItem {
  const item: DirectoryRepoItem = {
    repo_id: repo.repo_id,
    payout_address: repo.payout_address,
    registered_at: repo.registered_at,
    total_tipped: stats.total_tipped,
    tip_count: stats.tip_count,
    icon: normalizeRepoIcon(repo.icon),
  };
  if (sort !== "recent" && typeof stats.tipped_usd === "number") {
    item.tipped_usd = stats.tipped_usd;
  }
  return item;
}
