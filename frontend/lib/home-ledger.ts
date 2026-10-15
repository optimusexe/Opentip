import { prisma } from "@/lib/prisma";
import { getTokenDecimals, getTokenSymbol } from "@/lib/chain";
import { getTokenPrices, usdValue } from "@/lib/prices";
import {
  ALL_REPOS_LABEL,
  hiddenRepoSet,
  isHiddenRepoId,
  repoTipLabel,
  tipperLabel,
  visibleFundingUsd,
} from "@/lib/home-card";

export type HomeLedgerTip = {
  id: string;
  name: string;
  amount: string;
  symbol: string;
  repo: string;
  when: string;
};

export type HomeLedger = {
  project: string;
  fundedUsd: number;
  tips: HomeLedgerTip[];
};

function relTime(date: Date): string {
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toISOString().slice(0, 10);
}

function humanAmount(raw: string, decimals: number): string {
  const n = Number(raw) / Math.pow(10, decimals);
  if (!Number.isFinite(n)) return "0";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function excludeHiddenRepos(hiddenRepoIds: string[]) {
  if (hiddenRepoIds.length === 0) return {};
  return {
    NOT: {
      OR: hiddenRepoIds.map((id) => ({
        repo_id: { equals: id, mode: "insensitive" as const },
      })),
    },
  };
}

/** Real indexed funding for the landing card, across every visible repo. */
export async function getHomeLedger(): Promise<HomeLedger | null> {
  try {
    const [grouped, prices, hidden] = await Promise.all([
      prisma.tip.groupBy({
        by: ["repo_id", "token"],
        _sum: { amount: true },
      }),
      getTokenPrices().catch(() => ({})),
      prisma.repo.findMany({ where: { hidden: true }, select: { repo_id: true } }),
    ]);
    const hiddenIds = hidden.map((row) => row.repo_id);
    const hiddenSet = hiddenRepoSet(hiddenIds);
    const fundedUsd = visibleFundingUsd(
      grouped.map((row) => ({
        repo_id: row.repo_id,
        token: row.token,
        amount: row._sum.amount?.toString() ?? "0",
      })),
      hiddenSet,
      prices,
      usdValue,
    );
    if (fundedUsd == null) return null;
    const recent = await prisma.tip.findMany({
      where: excludeHiddenRepos(hiddenIds),
      orderBy: { timestamp: "desc" },
      take: 4,
    });
    const visibleRecent = recent.filter((tip) => !isHiddenRepoId(tip.repo_id, hiddenSet));
    const addresses = [...new Set(visibleRecent.map((tip) => tip.tipper_address))];
    const names = addresses.length
      ? await prisma.displayName.findMany({ where: { tipper_address: { in: addresses } } })
      : [];
    const nameMap = new Map(names.map((row) => [row.tipper_address.toLowerCase(), row.display_name]));
    return {
      project: ALL_REPOS_LABEL,
      fundedUsd,
      tips: visibleRecent.map((tip) => {
        const decimals = getTokenDecimals(tip.token);
        return {
          id: tip.id,
          name: tipperLabel(nameMap.get(tip.tipper_address.toLowerCase()), tip.tipper_address),
          amount: humanAmount(tip.amount.toString(), decimals),
          symbol: getTokenSymbol(tip.token),
          repo: repoTipLabel(tip.repo_id),
          when: relTime(tip.timestamp),
        };
      }),
    };
  } catch {
    return null;
  }
}
