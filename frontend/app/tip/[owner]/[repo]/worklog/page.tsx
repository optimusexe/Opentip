import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { capitalize } from "@/lib/chain";
import { prisma } from "@/lib/prisma";
import { isHiddenRepo } from "@/lib/repo-visibility";
import { formatWorklogDate, shortSha } from "@/lib/worklog";
import { fetchDefaultBranch, fetchOpenPullRequests } from "@/lib/worklog-github";
import { loadWorklog, userMaintainsRepo } from "@/lib/worklog-run";
import { RepoIcon } from "@/components/RepoIcon";
import { WorklogEntryList } from "@/components/worklog/WorklogEntryList";
import { UpdateWorklogButton } from "@/components/worklog/UpdateWorklogButton";

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
  return { title: `${capitalize(repo)} Worklog` };
}

export default async function WorklogPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  if (!validPart(owner) || !validPart(repo)) notFound();
  const repoId = `${owner}/${repo}`.toLowerCase();
  const record = await prisma.repo.findUnique({
    where: { repo_id: repoId },
    select: { hidden: true, icon: true },
  });
  if (isHiddenRepo(record)) notFound();

  const session = await getServerSession(authOptions);
  const [worklog, maintains, branch, pulls] = await Promise.all([
    loadWorklog(repoId).catch(() => null),
    userMaintainsRepo(session, repoId),
    fetchDefaultBranch(owner, repo),
    fetchOpenPullRequests(owner, repo),
  ]);
  const project = capitalize(repo);
  const branchName = worklog?.cursor?.branch || branch || "the default branch";
  const cursor = worklog?.cursor ?? null;

  return (
    <div className="flex min-w-0 flex-col">
      <p className="text-sm text-brand">
        <Link href={`/tip/${owner}/${repo}`} className="hover:underline">
          ← {project}
        </Link>
        <span> / {owner}/{repo} / Worklog</span>
      </p>

      <div className="mt-5 flex min-w-0 items-start gap-3">
        <RepoIcon repoId={repoId} logo={record?.icon} loadDeveloperPfp size={56} className="size-14" />
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{project} Worklog</h1>
          <p className="mt-1 text-sm text-muted-foreground">What shipped, from the repo&apos;s commits on {branchName}.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          {cursor ? (
            <>
              Last updated {formatWorklogDate(cursor.updatedAt)} · covers <span className="font-mono text-foreground">{shortSha(cursor.sha)}</span>
            </>
          ) : (
            "No update yet"
          )}
        </p>
        {maintains ? <p className="text-sm text-brand">You maintain this repo</p> : null}
        {maintains ? (
          <div className="sm:ml-auto">
            <UpdateWorklogButton repoId={repoId} />
          </div>
        ) : null}
      </div>

      <section className="mt-6 rounded-[10px] border border-dashed border-border px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Coming next</p>
        {pulls.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Nothing in progress right now. Open pull requests show up here.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {pulls.map((pull) => (
              <li key={pull.url}>
                <a href={pull.url} className="text-sm font-medium text-foreground hover:text-brand" target="_blank" rel="noreferrer">
                  {pull.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-2">
        <WorklogEntryList entries={worklog?.entries ?? []} />
      </div>

      <div className="mt-8">
        <Link
          href={`/tip/${owner}/${repo}`}
          className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          Tip this repo
        </Link>
      </div>
    </div>
  );
}
