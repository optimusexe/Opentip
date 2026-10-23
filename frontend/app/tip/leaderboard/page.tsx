import { prisma } from "@/lib/prisma";
import { getTokenPrices, usdValue } from "@/lib/prices";
import { rankTippersByUsd, usdByRepo, type RepoTokenTotal, type TipAggregateRow } from "@/lib/leaderboard-rank";
import { normalizeRepoIcon } from "@/lib/repo-icon";
import { LeaderboardBoard } from "./LeaderboardBoard";

async function getLeaderboard(): Promise<{ rows: { tipper_address: string; display_name: string | null; usd: number }[]; error: boolean }> {
  try {
    const [rows, prices] = await Promise.all([
      prisma.$queryRaw<TipAggregateRow[]>`
        SELECT tipper_address, SUM(amount)::text as total, token
        FROM "Tip"
        GROUP BY tipper_address, token
      `,
      getTokenPrices(),
    ]);

    const ranked = rankTippersByUsd(rows, prices, 20, usdValue);
    const addrs = ranked.map((r) => r.tipper_address);
    const names = addrs.length
      ? await prisma.displayName.findMany({ where: { tipper_address: { in: addrs } } })
      : [];
    const nameMap = new Map(names.map((n) => [n.tipper_address.toLowerCase(), n.display_name]));

    return {
      error: false,
      rows: ranked.map((r) => ({
        tipper_address: r.tipper_address,
        display_name: nameMap.get(r.tipper_address.toLowerCase()) || null,
        usd: r.usd,
      })),
    };
  } catch {
    return { rows: [], error: true };
  }
}

async function getRepoBoard() {
  try {
    const repos = await prisma.repo.findMany({ where: { hidden: false }, select: { repo_id: true, icon: true } });
    if (repos.length === 0) return [];
    const repoIds = repos.map((repo) => repo.repo_id);
    const [tipAgg, prices, funders] = await Promise.all([
      prisma.$queryRaw<RepoTokenTotal[]>`
        SELECT repo_id, token, SUM(amount)::text as total, COUNT(*)::int as count
        FROM "Tip"
        WHERE repo_id = ANY(${repoIds})
        GROUP BY repo_id, token
      `,
      getTokenPrices(),
      prisma.$queryRaw<{ repo_id: string; funders: number }[]>`
        SELECT repo_id, COUNT(DISTINCT tipper_address)::int as funders
        FROM "Tip"
        WHERE repo_id = ANY(${repoIds})
        GROUP BY repo_id
      `,
    ]);
    const byRepo = usdByRepo(tipAgg, prices, usdValue);
    const funderMap = new Map(funders.map((row) => [row.repo_id, Number(row.funders)]));
    return repos
      .map((repo) => ({
        repo_id: repo.repo_id,
        usd: byRepo.get(repo.repo_id)?.usd ?? 0,
        funders: funderMap.get(repo.repo_id) ?? 0,
        icon: normalizeRepoIcon(repo.icon),
      }))
      .sort((a, b) => b.usd - a.usd || a.repo_id.localeCompare(b.repo_id))
      .slice(0, 20);
  } catch {
    return null;
  }
}

export default async function LeaderboardPage() {
  const [{ rows, error }, repos] = await Promise.all([getLeaderboard(), getRepoBoard()]);
  return <LeaderboardBoard funders={rows} repos={repos} error={error} />;
}
