"use client";

import { useState } from "react";
import Link from "next/link";
import { capitalize } from "@/lib/chain";
import { fmtUsd } from "@/lib/prices";
import { Segmented } from "@/components/ledger/Segmented";
import { RepoIcon } from "@/components/RepoIcon";

type Funder = { tipper_address: string; display_name: string | null; usd: number };
type RepoRow = { repo_id: string; usd: number; funders: number; icon: string | null };

export function LeaderboardBoard({
  funders,
  repos,
  error,
}: {
  funders: Funder[];
  repos: RepoRow[] | null;
  error: boolean;
}) {
  const [tab, setTab] = useState<"repos" | "funders">("repos");

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Leaderboard</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Public totals. Ranks follow tipped volume.</p>
      </header>
      <div className="mt-6">
        <Segmented
          label="Leaderboard"
          value={tab}
          onChange={setTab}
          options={[
            { value: "repos", label: "Repos" },
            { value: "funders", label: "Supporters" },
          ]}
        />
      </div>
      <section className="py-6">
        {error ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Couldn&apos;t load the leaderboard. Try again in a minute.</p>
        ) : tab === "repos" ? (
          repos == null ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Couldn&apos;t load repos.</p>
          ) : repos.length === 0 ? (
            <Empty />
          ) : (
            <ol className="flex flex-col gap-2">
              {repos.map((repo, index) => (
                <li key={repo.repo_id}>
                  <Link href={`/tip/${repo.repo_id}`} className="flex min-w-0 items-center gap-3 rounded-[10px] border border-border px-4 py-3 hover:bg-muted/50">
                    <span className="w-6 font-mono text-sm text-brand">{index + 1}</span>
                    <RepoIcon repoId={repo.repo_id} logo={repo.icon} loadDeveloperPfp />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{capitalize(repo.repo_id.split("/")[1] || repo.repo_id)}</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">{repo.funders.toLocaleString("en-US")} {repo.funders === 1 ? "supporter" : "supporters"}</span>
                    <span className="font-mono text-sm tabular-nums">{fmtUsd(repo.usd)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )
        ) : funders.length === 0 ? (
          <Empty />
        ) : (
          <ol className="flex flex-col gap-2">
            {funders.map((row, index) => (
              <li key={row.tipper_address} className="flex min-w-0 items-center gap-3 rounded-[10px] border border-border px-4 py-3">
                <span className="w-6 font-mono text-sm text-brand">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-sm">{row.display_name || `${row.tipper_address.slice(0, 6)}...${row.tipper_address.slice(-4)}`}</span>
                <span className="font-mono text-sm tabular-nums">{fmtUsd(row.usd)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Empty() {
  return <p className="rounded-[10px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">Nothing on the board yet.</p>;
}
