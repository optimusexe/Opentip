"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { capitalize } from "@/lib/chain";
import { UrlSwap } from "@/components/ledger/UrlSwap";
import { RepoIcon } from "@/components/RepoIcon";

const PAGES = [
  ["Home", "/tip"],
  ["Repos", "/tip/repos"],
  ["Leaderboard", "/tip/leaderboard"],
  ["Activity", "/tip/activity"],
  ["Docs", "/tip/docs"],
  ["Dashboard", "/tip/dashboard"],
  ["Wallet", "/tip/wallet"],
  ["Sign in", "/tip/signin"],
];

type RepoHit = { repo_id: string; tipped_usd?: number; icon?: string | null };

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState<RepoHit[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const openEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("opentip-search", openEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("opentip-search", openEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ limit: "8", sort: "tipped" });
      if (query.trim()) params.set("q", query.trim());
      fetch(`/api/repos?${params}`)
        .then((r) => r.json())
        .then((j) => setRepos(Array.isArray(j.items) ? j.items : []))
        .catch(() => setRepos([]));
    }, 150);
    return () => clearTimeout(handle);
  }, [open, query]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const pages = PAGES.filter(([label]) => !q || label.toLowerCase().includes(q));

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center bg-foreground/40 px-4 pt-[12vh]" role="presentation" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Find a repo"
        className="w-full max-w-lg rounded-[10px] border border-border bg-popover p-4 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-sm font-medium">Find a repo</h2>
        <p className="mt-1 text-xs text-muted-foreground">Paste a GitHub URL or owner/repo. Tip pages live at opentip.tech/tip.</p>
        <div className="mt-3">
          <UrlSwap compact initial={query} onNavigate={() => setOpen(false)} />
        </div>
        <label className="mt-3 block text-xs text-muted-foreground" htmlFor="command-filter">
          Filter registered repos
        </label>
        <input
          id="command-filter"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search owner or repo"
          className="mt-1 h-9 w-full rounded-[10px] border border-border bg-background px-3 text-sm outline-none focus:border-accent"
        />
        <ul className="mt-3 max-h-64 overflow-auto">
          {pages.map(([label, href]) => (
            <li key={href}>
              <button type="button" className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => go(href)}>
                <span>{label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{href}</span>
              </button>
            </li>
          ))}
          {repos.map((repo) => {
            const name = capitalize(repo.repo_id.split("/")[1] || repo.repo_id);
            return (
              <li key={repo.repo_id}>
                <button type="button" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => go(`/tip/${repo.repo_id}`)}>
                  <RepoIcon repoId={repo.repo_id} logo={repo.icon} loadDeveloperPfp size={28} className="size-7" />
                  <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{repo.repo_id}</span>
                </button>
              </li>
            );
          })}
          {pages.length === 0 && repos.length === 0 ? (
            <li className="px-2 py-3 text-sm text-muted-foreground">No registered repos match.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
