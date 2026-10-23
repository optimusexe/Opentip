import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchRepoMeta } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { getTokenPrices, usdValue, fmtUsd } from "@/lib/prices";
import { generateRepoSummary, type RepoSummary } from "@/lib/ai";
import { capitalize } from "@/lib/chain";
import { isHiddenRepo } from "@/lib/repo-visibility";
import { resolveRepoIcon } from "@/lib/repo-icon";
import { pageShareMetadata } from "@/lib/share-metadata";
import { formatWorklogRange } from "@/lib/worklog";
import TipClient from "./TipClient";

type Link = { title: string; url: string };

async function getOrCreateSummary(repoId: string, owner: string, repo: string) {
  try {
    const existing = await prisma.repo.findUnique({
      where: { repo_id: repoId.toLowerCase() },
      select: { summary: true, summary_generated_at: true },
    });

    if (existing?.summary && existing.summary_generated_at) {
      const age = Date.now() - existing.summary_generated_at.getTime();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (age < SEVEN_DAYS) {
        return JSON.parse(existing.summary);
      }
    }

    const summary = await generateRepoSummary(owner, repo);

    await prisma.repo.update({
      where: { repo_id: repoId.toLowerCase() },
      data: {
        summary: JSON.stringify(summary),
        summary_generated_at: new Date(),
      },
    }).catch(() => {});

    return summary;
  } catch {
    return null;
  }
}

async function getLinks(repoId: string): Promise<Link[]> {
  try {
    const repo = await prisma.repo.findUnique({
      where: { repo_id: repoId.toLowerCase() },
      select: { links: true },
    });
    if (repo?.links) return JSON.parse(repo.links);
  } catch {}
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}): Promise<Metadata> {
  const { owner, repo } = await params;
  const repoId = `${owner}/${repo}`;
  const path = `/tip/${owner}/${repo}`;
  const share = (description: string) =>
    pageShareMetadata({
      title: `${repoId} on Opentip`,
      description,
      path,
      imagePath: `${path}/opengraph-image`,
      imageAlt: "Tip this repo",
    });
  try {
    const [tips, prices] = await Promise.all([
      prisma.tip
        .groupBy({
          by: ["token"],
          where: { repo_id: repoId.toLowerCase() },
          _sum: { amount: true },
          _count: true,
        })
        .catch(() => []),
      getTokenPrices().catch(() => ({})),
    ]);
    const totalUsd = tips.reduce((s, t) => s + usdValue(t._sum.amount?.toString() ?? "0", t.token, prices), 0);
    const count = tips.reduce((s, t) => s + (t._count ?? 0), 0);
    const description =
      count > 0
        ? `${fmtUsd(totalUsd)} tipped across ${count} tip${count === 1 ? "" : "s"}. Tip ${repoId} on Opentip.`
        : `Tip ${repoId} on Opentip. Be the first, from $1.`;
    return share(description);
  } catch {
    return share(`Tip ${repoId} on Opentip.`);
  }
}

export default async function RepoPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const repoId = `${owner}/${repo}`;
  const meta = await fetchRepoMeta(owner, repo);

  let summary: RepoSummary | null = null;
  let links: Link[] = [];
  let funderCount: number | null = null;
  let developer: { login: string; pfp: string | null; image: string | null } | null = null;
  let repoRecord: { payout_address: string; hidden: boolean; icon: string | null } | null = null;

  try {
    const funders = await prisma.tip.groupBy({
      by: ["tipper_address"],
      where: { repo_id: repoId.toLowerCase() },
    });
    funderCount = funders.length;
  } catch {
    funderCount = null;
  }

  try {
    repoRecord = await prisma.repo.findUnique({
      where: { repo_id: repoId.toLowerCase() },
      select: { payout_address: true, hidden: true, icon: true },
    });
    // notFound() throws; calling it inside this try would be swallowed and
    // the hidden repo would render. The check below runs after the catch.
    if (repoRecord && !isHiddenRepo(repoRecord)) {
      const wallet = await prisma.userWallet.findUnique({
        where: { address: repoRecord.payout_address },
        select: { user: { select: { login: true, pfp: true, image: true } } },
      });
      if (wallet?.user?.login) {
        developer = { login: wallet.user.login, pfp: wallet.user.pfp, image: wallet.user.image };
      }
      const [s, l] = await Promise.all([
        getOrCreateSummary(repoId, owner, repo),
        getLinks(repoId),
      ]);
      summary = asSummary(s);
      links = l;
    }
  } catch {}

  if (isHiddenRepo(repoRecord)) notFound();

  let worklog: { label: string; title: string } | null = null;
  try {
    const latest = await prisma.worklogEntry.findFirst({
      where: { repo_id: repoId.toLowerCase() },
      orderBy: { ends_at: "desc" },
      select: { title: true, starts_at: true, ends_at: true },
    });
    if (latest) {
      worklog = {
        label: formatWorklogRange(latest.starts_at.toISOString(), latest.ends_at.toISOString()),
        title: latest.title,
      };
    }
  } catch {
    worklog = null;
  }

  const resolvedIcon = resolveRepoIcon({
    logo: repoRecord?.icon,
    developerPfp: meta?.owner.avatar_url,
    name: repo,
  });

  return (
    <TipClient
      repoId={repoId}
      project={capitalize(repo)}
      description={meta?.description ?? null}
      icon={resolvedIcon.kind === "image" ? resolvedIcon.src : null}
      summary={summary}
      links={links}
      developer={developer}
      funderCount={funderCount}
      worklog={worklog}
    />
  );
}

function asSummary(value: unknown): RepoSummary | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<RepoSummary>;
  if (typeof row.description !== "string") return null;
  return {
    description: row.description,
    techStack: Array.isArray(row.techStack) ? row.techStack.filter((item): item is string => typeof item === "string") : [],
    features: Array.isArray(row.features) ? row.features.filter((item): item is string => typeof item === "string") : [],
    audience: typeof row.audience === "string" ? row.audience : "",
  };
}
