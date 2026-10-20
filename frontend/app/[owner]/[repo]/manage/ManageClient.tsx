"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { RepoIcon } from "@/components/RepoIcon";
import { WorklogEntryList } from "@/components/worklog/WorklogEntryList";
import { UpdateWorklogButton } from "@/components/worklog/UpdateWorklogButton";
import { useToast } from "@/app/providers";
import { opentipV2Abi } from "@/lib/contract";
import { CHAIN_ID, CONTRACT_ADDRESS, ETH_ADDRESS, OAR_ADDRESS, USDC_ADDRESS, getTokenDecimals } from "@/lib/chain";
import { fmtUsd } from "@/lib/prices";
import { formatWorklogUpdated, shortSha } from "@/lib/worklog";
import type { WorklogPayload } from "@/lib/worklog-run";

type LinkItem = { id: string; title: string; url: string };

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "worklog", label: "Worklog" },
  { id: "profile", label: "Profile" },
  { id: "links", label: "Links" },
  { id: "summary", label: "AI summary" },
];

const TOKENS = [USDC_ADDRESS, ETH_ADDRESS, OAR_ADDRESS];

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function newLink(): LinkItem {
  return { id: crypto.randomUUID(), title: "", url: "" };
}

export default function ManageClient({
  owner,
  repo,
  repoId,
  project,
  payout,
  icon,
  tipCount,
  summaryStatus,
  initialLinks,
  initialWorklog,
}: {
  owner: string;
  repo: string;
  repoId: string;
  project: string;
  payout: string;
  icon: string | null;
  tipCount: number;
  summaryStatus: string;
  initialLinks: LinkItem[];
  initialWorklog: WorklogPayload;
}) {
  const { address } = useAccount();
  const { showToast } = useToast();
  const contract = CONTRACT_ADDRESS;
  const [active, setActive] = useState("overview");
  const [logo, setLogo] = useState(icon);
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);
  const [saving, setSaving] = useState(false);
  const [worklog, setWorklog] = useState(initialWorklog);
  const [checking, setChecking] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    setWorklog(initialWorklog);
  }, [initialWorklog]);

  useEffect(() => {
    fetch("/api/prices").then((res) => res.json()).then(setPrices).catch(() => {});
  }, []);

  const calls = contract
    ? TOKENS.flatMap((token) => [
        { address: contract, abi: opentipV2Abi, functionName: "getPendingBalance" as const, args: [repoId, token], chainId: CHAIN_ID },
        { address: contract, abi: opentipV2Abi, functionName: "getTotalTipped" as const, args: [repoId, token], chainId: CHAIN_ID },
      ])
    : [];
  const { data: onChainData } = useReadContracts({ contracts: calls });

  const balances = useMemo(() => {
    let pendingUsd = 0;
    let totalUsd = 0;
    const rows = TOKENS.map((token, index) => {
      const pendingResult = onChainData?.[index * 2];
      const totalResult = onChainData?.[index * 2 + 1];
      const pending = pendingResult?.status === "success" ? (pendingResult.result as bigint) : 0n;
      const total = totalResult?.status === "success" ? (totalResult.result as bigint) : 0n;
      const decimals = getTokenDecimals(token);
      const price = prices[token.toLowerCase()] ?? 0;
      const pendingAmount = Number(formatUnits(pending, decimals));
      const totalAmount = Number(formatUnits(total, decimals));
      pendingUsd += pendingAmount * price;
      totalUsd += totalAmount * price;
      const symbol = token === USDC_ADDRESS ? "USDC" : token === ETH_ADDRESS ? "ETH" : "OAR";
      return { symbol, pendingAmount, pendingUsd: pendingAmount * price };
    });
    return { rows, pendingUsd, totalUsd };
  }, [onChainData, prices]);

  const cursor = worklog.cursor;
  const branch = cursor?.branch || "the default branch";
  const statusLabel = checking ? "Checking" : "Up to date";
  const statusText = checking
    ? cursor
      ? `Checking new commits on ${branch} since ${shortSha(cursor.sha)}...`
      : `Checking recent commits on ${branch}...`
    : cursor?.detail || (cursor
      ? `No new commits since the last update. Push or merge to ${branch}, then update again.`
      : "No Worklog yet. Update Worklog to read recent commits on the default branch.");

  function jump(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("repoId", repoId);
      const res = await fetch("/api/upload/repo-icon", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) setLogo(data.url);
      else showToast({ status: "error", title: typeof data.error === "string" ? data.error : "upload failed" });
    } catch {
      showToast({ status: "error", title: "upload failed" });
    } finally {
      setUploading(false);
    }
  }

  async function saveLinks() {
    setSaving(true);
    try {
      const res = await fetch("/api/repos/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, links: links.map(({ title, url }) => ({ title, url })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLinks((data.links || []).map((link: { title: string; url: string }) => ({ ...link, id: crypto.randomUUID() })));
        showToast({ status: "success", title: "Links saved" });
      } else {
        showToast({ status: "error", title: typeof data.error === "string" ? data.error : "Could not save links" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        {" / "}
        <Link href="/dashboard/repos" className="hover:text-foreground">Your repos</Link>
        {" / "}
        <span>{owner}/{repo}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <RepoIcon repoId={repoId} logo={logo} loadDeveloperPfp size={48} className="size-12" />
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Manage {project}</h1>
            <p className="text-sm text-muted-foreground">{owner}/{repo}</p>
          </div>
        </div>
        <Link href={`/${owner}/${repo}`} className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-muted">
          View repo page
        </Link>
      </div>

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav aria-label="Manage sections" className="flex gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => jump(section.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-sm ${active === section.id ? "bg-accent/10 text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          <section id="overview" className="scroll-mt-24 rounded-[10px] border border-border bg-card p-4">
            <h2 className="text-sm font-medium">Overview</h2>
            <p className="mt-1 text-xs text-muted-foreground">Tips and pending balance for this repo. Claim whenever you want.</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pending</p>
                <p className="mt-1 font-mono text-xl text-pending tabular-nums">{money(balances.pendingUsd)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tipped</p>
                <p className="mt-1 font-mono text-xl tabular-nums">{money(balances.totalUsd)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tips</p>
                <p className="mt-1 font-mono text-xl tabular-nums">{tipCount}</p>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {balances.rows.map((row) => (
                <li key={row.symbol} className="flex items-center justify-between gap-3">
                  <span>{row.symbol}</span>
                  <span className="font-mono text-xs tabular-nums">
                    {row.pendingAmount.toFixed(4)} {fmtUsd(row.pendingUsd)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs text-muted-foreground">Payout {address && payout.toLowerCase() === address.toLowerCase() ? payout : `${payout.slice(0, 6)}...${payout.slice(-4)}`}</p>
              <Link href={`/${owner}/${repo}`}>
                <Button size="sm">Claim</Button>
              </Link>
            </div>
          </section>

          <section id="worklog" className="scroll-mt-24 rounded-[10px] border border-brand bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-sm font-medium">Worklog</h2>
              <UpdateWorklogButton
                repoId={repoId}
                onPhase={(phase, payload) => {
                  setChecking(phase === "checking");
                  if (payload) setWorklog(payload);
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Click Update after you merge pull requests or push to {branch}. Newer commits are grouped into entries on your Worklog page.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Last update</p>
                <p className="mt-1 text-sm">{cursor ? formatWorklogUpdated(cursor.updatedAt) : "Not yet"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Last commit covered</p>
                {cursor ? (
                  <p className="mt-1 truncate text-sm">
                    <span className="font-mono text-brand">{shortSha(cursor.sha)}</span> {cursor.message}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">None yet</p>
                )}
              </div>
            </div>
            <div className="mt-4 rounded-[10px] border border-border bg-muted/40 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">State: {statusLabel}</p>
              <p className="mt-1 text-sm">{statusText}</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Current entries · {worklog.entries.length}</p>
              <Link href={`/${owner}/${repo}/worklog`} className="text-sm text-brand hover:underline">View Worklog page →</Link>
            </div>
            <WorklogEntryList entries={worklog.entries} />
          </section>

          <section id="profile" className="scroll-mt-24 rounded-[10px] border border-border bg-card p-4">
            <h2 className="text-sm font-medium">Profile</h2>
            <p className="mt-1 text-xs text-muted-foreground">Your project logo shows on the repo page, lists, and share cards.</p>
            <div className="mt-4">
              <RepoIcon repoId={repoId} logo={logo} loadDeveloperPfp size={56} className="size-14" />
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-3">
              <span className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium">
                {uploading ? <Loader variant="spinner" size={14} /> : "Upload new logo"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(file);
                  event.target.value = "";
                }}
              />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, WebP or GIF</p>
          </section>

          <section id="links" className="scroll-mt-24 rounded-[10px] border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium">Links</h2>
              <span className="text-xs text-muted-foreground">{links.length}/10</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Documentation, social, or community links. Up to 10.</p>
            <div className="mt-4 space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-start gap-2">
                  <input
                    type="text"
                    aria-label="Link title"
                    placeholder="Title"
                    value={link.title}
                    onChange={(event) => setLinks((current) => current.map((item) => item.id === link.id ? { ...item, title: event.target.value } : item))}
                    className="w-28 rounded-[10px] border border-border bg-transparent px-2 py-1.5 text-xs outline-none focus:border-brand sm:w-32"
                  />
                  <input
                    type="url"
                    aria-label="Link URL"
                    placeholder="https://"
                    value={link.url}
                    onChange={(event) => setLinks((current) => current.map((item) => item.id === link.id ? { ...item, url: event.target.value } : item))}
                    className="min-w-0 flex-1 rounded-[10px] border border-border bg-transparent px-2 py-1.5 font-mono text-xs outline-none focus:border-brand"
                  />
                  <button type="button" aria-label="Remove link" onClick={() => setLinks((current) => current.filter((item) => item.id !== link.id))} className="px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive">
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              {links.length < 10 ? (
                <button type="button" onClick={() => setLinks((current) => [...current, newLink()])} className="text-xs text-muted-foreground hover:text-brand">
                  + Add link
                </button>
              ) : <span />}
              <Button size="sm" onClick={saveLinks} disabled={saving}>{saving ? "Saving..." : "Save links"}</Button>
            </div>
          </section>

          <section id="summary" className="scroll-mt-24 rounded-[10px] border border-border bg-card p-4">
            <h2 className="text-sm font-medium">AI summary</h2>
            <p className="mt-1 text-xs text-muted-foreground">The About text on your repo page, written from your README.</p>
            <p className="mt-3 inline-flex rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{summaryStatus}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
