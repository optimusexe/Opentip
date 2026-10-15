import { prisma } from "@/lib/prisma";
import { getTokenPrices, usdValue, fmtUsd } from "@/lib/prices";
import { fetchRepoMeta } from "@/lib/github";
import { RepoOgCard, imgToDataUrl, loadOgAssets, loadOgFonts, ogResponse } from "@/lib/og-image";
import { amountFontSize, displayRepoName, displayRepoUrl } from "@/lib/og-layout";

export const runtime = "nodejs";
export const alt = "Tip this repo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const repoKey = `${owner}/${repo}`.toLowerCase();

  const [fonts, record, tips, prices, meta, assets] = await Promise.all([
    loadOgFonts(),
    prisma.repo
      .findUnique({
        where: { repo_id: repoKey },
        select: { icon: true, hidden: true },
      })
      .catch(() => null),
    prisma.tip
      .groupBy({
        by: ["token"],
        where: { repo_id: repoKey },
        _sum: { amount: true },
        _count: true,
      })
      .catch(() => []),
    getTokenPrices().catch(() => ({})),
    fetchRepoMeta(owner, repo).catch(() => null),
    loadOgAssets(),
  ]);

  // Same distinct-tipper count as the project page Supporters stat.
  // Hidden and unregistered repos still render; a hidden row is not a 404 here.
  let supporterCount: number | null = null;
  try {
    const supporters = await prisma.tip.groupBy({
      by: ["tipper_address"],
      where: { repo_id: repoKey },
    });
    supporterCount = supporters.length;
  } catch {
    supporterCount = null;
  }

  const totalUsd = tips.reduce((sum, tip) => sum + usdValue(tip._sum.amount?.toString() ?? "0", tip.token, prices), 0);
  const tipCount = tips.reduce((sum, tip) => sum + (tip._count ?? 0), 0);
  const hasTips = tipCount > 0;
  const totalLabel = fmtUsd(totalUsd);
  const name = displayRepoName(repo);
  const url = displayRepoUrl(owner.toLowerCase(), repo.toLowerCase());
  const avatarSource = meta?.owner.avatar_url || `https://github.com/${owner}.png`;
  const iconSource = record?.icon || avatarSource;
  const [icon, avatar] = await Promise.all([imgToDataUrl(iconSource), imgToDataUrl(avatarSource)]);

  const element = (
    <RepoOgCard
      hasTips={hasTips}
      totalLabel={totalLabel}
      amountSize={amountFontSize(totalLabel)}
      supporterCount={hasTips ? supporterCount : null}
      repoName={name.text}
      repoNameSize={name.fontSize}
      owner={meta?.owner.login || owner}
      icon={icon}
      avatar={avatar}
      url={url.text}
      urlSize={url.fontSize}
      mark={assets.mark}
      eth={assets.eth}
      usdc={assets.usdc}
    />
  );

  return ogResponse(element, fonts, `repo:${repoKey}${record?.hidden ? ":hidden" : ""}`);
}
