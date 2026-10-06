export type TipAggregateRow = {
  tipper_address: string;
  total: string;
  token: string;
};

export type RankedTipper = {
  tipper_address: string;
  usd: number;
};

// Sum every token for a tipper, then sort by USD. Callers must not LIMIT
// the SQL by raw base units before this runs, or a high-USD tip in a
// small-decimal token gets cut.
export type ToUsd = (raw: string, token: string, prices: Record<string, number>) => number;

export function rankTippersByUsd(
  rows: TipAggregateRow[],
  prices: Record<string, number>,
  limit: number,
  toUsd: ToUsd,
): RankedTipper[] {
  const merged = new Map<string, RankedTipper>();
  for (const row of rows) {
    const key = row.tipper_address.toLowerCase();
    const current = merged.get(key) ?? { tipper_address: row.tipper_address, usd: 0 };
    current.usd += toUsd(row.total, row.token, prices);
    merged.set(key, current);
  }
  return [...merged.values()].sort((a, b) => b.usd - a.usd).slice(0, limit);
}

export type RepoTokenTotal = {
  repo_id: string;
  token: string;
  total: string;
  count: number;
};

// Per-repo USD and tip count. Callers sort by usd so a high-decimal token
// does not outrank a smaller raw amount that is worth more.
export function usdByRepo(
  rows: RepoTokenTotal[],
  prices: Record<string, number>,
  toUsd: ToUsd,
): Map<string, { usd: number; count: number }> {
  const map = new Map<string, { usd: number; count: number }>();
  for (const row of rows) {
    const current = map.get(row.repo_id) ?? { usd: 0, count: 0 };
    let usd = 0;
    try {
      usd = toUsd(row.total, row.token, prices);
    } catch {
      usd = 0;
    }
    if (!Number.isFinite(usd)) usd = 0;
    current.usd += usd;
    current.count += Number.isFinite(row.count) ? row.count : 0;
    map.set(row.repo_id, current);
  }
  return map;
}

export function rowsForTopTippers<T extends TipAggregateRow>(
  rows: T[],
  prices: Record<string, number>,
  limit: number,
  toUsd: ToUsd,
): T[] {
  const ranked = rankTippersByUsd(rows, prices, limit, toUsd);
  const order = new Map(ranked.map((row, index) => [row.tipper_address.toLowerCase(), index]));
  return rows
    .filter((row) => order.has(row.tipper_address.toLowerCase()))
    .sort((a, b) => order.get(a.tipper_address.toLowerCase())! - order.get(b.tipper_address.toLowerCase())!);
}
