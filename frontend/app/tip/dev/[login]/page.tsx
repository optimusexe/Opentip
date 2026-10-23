import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTokenDecimals } from "@/lib/chain";
import { prisma } from "@/lib/prisma";
import { getTokenPrices, usdValue, fmtUsd } from "@/lib/prices";
import { normalizeRepoIcon } from "@/lib/repo-icon";
import { pageShareMetadata } from "@/lib/share-metadata";
import ProfileClient from "./ProfileClient";

async function fetchContributions(login: string) {
  if (!/^[a-zA-Z0-9-]+$/.test(login)) return [];
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${login}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.contributions || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ login: string }>;
}): Promise<Metadata> {
  const { login } = await params;
  if (!/^[a-zA-Z0-9-]+$/.test(login)) return { title: "Developer" };
  const share = (description: string) =>
    pageShareMetadata({
      title: `@${login} on Opentip`,
      description,
      path: `/tip/dev/${login}`,
    });
  try {
    const user = await prisma.user.findUnique({
      where: { login },
      select: {
        id: true,
        wallets: { select: { address: true } },
        profile: { select: { bio: true } },
      },
    });
    if (!user) return share(`Tip @${login}'s open-source work on Opentip.`);
    const addresses = user.wallets.map((w) => w.address);
    let description = user.profile?.bio || `Tip @${login}'s open-source work on Opentip.`;
    if (addresses.length > 0) {
      const repos = await prisma.repo
        .findMany({
          where: { payout_address: { in: addresses }, hidden: false },
          select: { repo_id: true },
        })
        .catch(() => []);
      if (repos.length > 0) {
        const [tips, prices] = await Promise.all([
          prisma.tip
            .groupBy({
              by: ["token"],
              where: { repo_id: { in: repos.map((r) => r.repo_id) } },
              _sum: { amount: true },
              _count: true,
            })
            .catch(() => []),
          getTokenPrices().catch(() => ({})),
        ]);
        const count = tips.reduce((s, t) => s + (t._count ?? 0), 0);
        if (count > 0) {
          const totalUsd = tips.reduce((s, t) => s + usdValue(t._sum.amount?.toString() ?? "0", t.token, prices), 0);
          description = `@${login} received ${fmtUsd(totalUsd)} across ${count} tip${count === 1 ? "" : "s"} on Opentip.`;
        }
      }
    }
    return share(description);
  } catch {
    return share(`Tip @${login}'s open-source work on Opentip.`);
  }
}

export default async function DevProfilePage({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;
  if (!/^[a-zA-Z0-9-]+$/.test(login)) notFound();

  const user = await prisma.user.findUnique({
    where: { login },
    select: {
      id: true,
      login: true,
      name: true,
      image: true,
      pfp: true,
      header: true,
      wallets: {
        select: { address: true },
      },
    },
  });

  if (!user) notFound();

  let profile = null;
  try {
    profile = await prisma.developerProfile.findUnique({
      where: { userId: user.id },
      select: {
        bio: true,
        website: true,
        twitter: true,
        discord: true,
        telegram: true,
        farcaster: true,
        github: true,
      },
    });
  } catch {
    // profile table may not exist yet
  }

  const walletAddresses = user.wallets.map((w) => w.address);

  const repos = walletAddresses.length > 0
    ? await prisma.repo.findMany({
        where: { payout_address: { in: walletAddresses }, hidden: false },
        select: {
          repo_id: true,
          registered_at: true,
          icon: true,
        },
      })
    : [];

  const repoIds = repos.map((r) => r.repo_id);
  const tips = repoIds.length > 0
    ? await prisma.tip.groupBy({
        by: ["repo_id", "token"],
        where: { repo_id: { in: repoIds } },
        _sum: { amount: true },
        _count: true,
      })
    : [];

  const prices = await getTokenPrices();

  const tipMap = new Map<string, { total: number; count: number; usd: number }>();
  let totalTippedUsd = 0;
  for (const t of tips) {
    const key = t.repo_id;
    const existing = tipMap.get(key) || { total: 0, count: 0, usd: 0 };
    const decimals = getTokenDecimals(t.token);
    const amt = Number(t._sum.amount?.toString() ?? "0");
    const humanAmount = amt / Math.pow(10, decimals);
    existing.total += humanAmount;
    existing.count += t._count;
    const tokenKey = t.token.toLowerCase();
    const price = prices[tokenKey] ?? 0;
    const usd = humanAmount * price;
    existing.usd += usd;
    tipMap.set(key, existing);
    totalTippedUsd += usd;
  }

  const enrichedRepos = repos.map((r) => ({
    repo_id: r.repo_id,
    total_tipped: tipMap.get(r.repo_id)?.total ?? 0,
    tip_count: tipMap.get(r.repo_id)?.count ?? 0,
    usd: tipMap.get(r.repo_id)?.usd ?? 0,
    icon: normalizeRepoIcon(r.icon),
  }));

  const totalTips = enrichedRepos.reduce((sum, r) => sum + r.tip_count, 0);

  const contributions = await fetchContributions(login);

  const profileData = {
    login: user.login,
    name: user.name,
    image: user.image,
    pfp: user.pfp,
    header: user.header,
    bio: profile?.bio ?? null,
    social: {
      website: profile?.website ?? null,
      twitter: profile?.twitter ?? null,
      discord: profile?.discord ?? null,
      telegram: profile?.telegram ?? null,
      farcaster: profile?.farcaster ?? null,
      github: profile?.github ?? user.login,
    },
    repos: enrichedRepos,
    stats: {
      total_tipped_usd: totalTippedUsd,
      total_tips: totalTips,
      repo_count: enrichedRepos.length,
    },
  };

  return <ProfileClient data={profileData} contributions={contributions} />;
}
