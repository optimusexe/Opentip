import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenSymbol, getTokenDecimals } from "@/lib/chain";
import { normalizeRepoIcon } from "@/lib/repo-icon";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId")?.toLowerCase() || null;
  const tipperAddress = req.nextUrl.searchParams.get("tipper_address")?.toLowerCase() || null;
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "50", 10)));
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const offset = (page - 1) * limit;

  const where: any = {};
  if (repoId) where.repo_id = repoId;
  if (tipperAddress) where.tipper_address = tipperAddress;

  const tips = await prisma.tip.findMany({
    where,
    orderBy: { timestamp: "desc" },
    skip: offset,
    take: limit,
  });

  const tipperAddresses = [...new Set(tips.map(t => t.tipper_address))];
  const displayNames = tipperAddresses.length > 0
    ? await prisma.displayName.findMany({ where: { tipper_address: { in: tipperAddresses } } })
    : [];
  const nameMap = new Map(displayNames.map(n => [n.tipper_address.toLowerCase(), n.display_name]));
  const repoIds = [...new Set(tips.map(t => t.repo_id))];
  const iconRows = repoIds.length
    ? await prisma.repo.findMany({ where: { repo_id: { in: repoIds } }, select: { repo_id: true, icon: true } })
    : [];
  const iconMap = new Map(iconRows.map(row => [row.repo_id, normalizeRepoIcon(row.icon)]));

  return NextResponse.json(
    tips.map(t => ({
      ...t,
      amount: t.amount.toString(),
      token: t.token,
      symbol: getTokenSymbol(t.token),
      decimals: getTokenDecimals(t.token),
      fee_amount: t.fee_amount.toString(),
      block_number: t.block_number.toString(),
      display_name: nameMap.get(t.tipper_address.toLowerCase()) || null,
      icon: iconMap.get(t.repo_id) ?? null,
    }))
  );
}
