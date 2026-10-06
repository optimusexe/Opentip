import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPrices, usdValue } from "@/lib/prices";
import { usdByRepo, type RepoTokenTotal } from "@/lib/leaderboard-rank";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const q = url.searchParams.get("q") || "";
  const sort = url.searchParams.get("sort") || "tipped";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  const where = q
    ? { hidden: false, repo_id: { contains: q, mode: "insensitive" as const } }
    : { hidden: false };

  if (sort === "recent") {
    const total = await prisma.repo.count({ where });
    const repos = await prisma.repo.findMany({
      where,
      orderBy: { registered_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const repoIds = repos.map(r => r.repo_id);
    const tipAgg: any[] = repoIds.length > 0 ? await prisma.$queryRaw`
      SELECT repo_id, SUM(amount)::text as total, COUNT(*)::int as count
      FROM "Tip"
      WHERE repo_id = ANY(${repoIds})
      GROUP BY repo_id
    ` : [];

    const tipMap = new Map<string, { total: string; count: number }>();
    for (const row of tipAgg) {
      tipMap.set(row.repo_id, { total: row.total ?? "0", count: row.count ?? 0 });
    }

    return NextResponse.json({
      items: repos.map(r => {
        const agg = tipMap.get(r.repo_id);
        return {
          repo_id: r.repo_id,
          payout_address: r.payout_address,
          registered_at: r.registered_at,
          total_tipped: agg?.total ?? "0",
          tip_count: agg?.count ?? 0,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  const repos = await prisma.repo.findMany({ where });
  if (repos.length === 0) {
    return NextResponse.json({ items: [], total: 0, page: 1, limit, totalPages: 0 });
  }

  const repoIds = repos.map(r => r.repo_id);
  const tipAgg = await prisma.$queryRaw<RepoTokenTotal[]>`
    SELECT repo_id, token, SUM(amount)::text as total, COUNT(*)::int as count
    FROM "Tip"
    WHERE repo_id = ANY(${repoIds})
    GROUP BY repo_id, token
  `;
  const prices = await getTokenPrices();
  const byRepo = usdByRepo(tipAgg, prices, usdValue);
  const rawByRepo = new Map<string, bigint>();
  for (const row of tipAgg) {
    const current = rawByRepo.get(row.repo_id) ?? 0n;
    try { rawByRepo.set(row.repo_id, current + BigInt(row.total)); } catch { /* skip a bad amount */ }
  }

  let items = repos.map(r => {
    const agg = byRepo.get(r.repo_id);
    return {
      repo_id: r.repo_id,
      payout_address: r.payout_address,
      registered_at: r.registered_at,
      total_tipped: (rawByRepo.get(r.repo_id) ?? 0n).toString(),
      tip_count: agg?.count ?? 0,
      tipped_usd: agg?.usd ?? 0,
      icon: r.icon,
    };
  });

  if (sort === "tipped") {
    items.sort((a, b) => b.tipped_usd - a.tipped_usd || a.repo_id.localeCompare(b.repo_id));
  } else if (sort === "tips") {
    items.sort((a, b) => b.tip_count - a.tip_count);
  }

  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return NextResponse.json({
    items: paged,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
