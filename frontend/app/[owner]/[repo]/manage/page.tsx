import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { capitalize } from "@/lib/chain";
import { prisma } from "@/lib/prisma";
import { loadWorklog, userMaintainsRepo } from "@/lib/worklog-run";
import ManageClient from "./ManageClient";

export const dynamic = "force-dynamic";

function validPart(value: string) {
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}): Promise<Metadata> {
  const { repo } = await params;
  return { title: `Manage ${capitalize(repo)}` };
}

export default async function ManagePage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  if (!validPart(owner) || !validPart(repo)) notFound();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/signin?callbackUrl=/${owner}/${repo}/manage`);

  const repoId = `${owner}/${repo}`.toLowerCase();
  const allowed = await userMaintainsRepo(session, repoId);
  if (!allowed) notFound();

  const record = await prisma.repo.findUnique({
    where: { repo_id: repoId },
    select: { payout_address: true, icon: true, links: true, summary: true, summary_generated_at: true },
  });
  if (!record) notFound();

  let links: { title: string; url: string }[] = [];
  try {
    const parsed = record.links ? JSON.parse(record.links) : [];
    if (Array.isArray(parsed)) {
      links = parsed.filter((link) => link && typeof link.title === "string" && typeof link.url === "string");
    }
  } catch {
    links = [];
  }

  const fresh = record.summary && record.summary_generated_at
    ? Date.now() - record.summary_generated_at.getTime() < 7 * 24 * 60 * 60 * 1000
    : false;
  const summaryStatus = record.summary ? (fresh ? "Summary cached" : "Summary generated") : "No summary generated yet";
  const tipCount = await prisma.tip.count({ where: { repo_id: repoId } });
  const worklog = await loadWorklog(repoId);

  return (
    <ManageClient
      owner={owner}
      repo={repo}
      repoId={repoId}
      project={capitalize(repo)}
      payout={record.payout_address}
      icon={record.icon}
      tipCount={tipCount}
      summaryStatus={summaryStatus}
      initialLinks={links.map((link, index) => ({ id: `saved-${index}-${link.url}`, title: link.title, url: link.url }))}
      initialWorklog={worklog}
    />
  );
}
