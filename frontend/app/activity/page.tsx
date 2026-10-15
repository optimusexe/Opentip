"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { ExternalLink } from "lucide-react";
import { getBasescanTxUrl } from "@/lib/basescan";
import { getTokenSymbol, getTokenDecimals, capitalize } from "@/lib/chain";
import { RepoIcon } from "@/components/RepoIcon";

const PAGE_SIZE = 20;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function truncate(addr: string) { return addr.slice(0, 6) + "..." + addr.slice(-4); }

export default function ActivityFeed() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tips?page=${page}&limit=${PAGE_SIZE}`)
      .then(r => r.json())
      .then(j => {
        setTips(Array.isArray(j) ? j : []);
        setHasMore(Array.isArray(j) && j.length === PAGE_SIZE);
      })
      .catch(() => { setTips([]); setHasMore(false); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b border-border space-y-4">
        <h1 className="font-display text-4xl">Activity</h1>
        <p className="max-w-xl text-sm text-muted-foreground">A live feed of tips.</p>
      </section>

      <section className="py-10">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader variant="dots" size={20} /></div>
        ) : tips.length === 0 ? (
          <div className="py-12 space-y-3">
            <p className="text-sm text-muted-foreground">No tips yet.</p>
            <Link href="/repos" className="text-sm underline underline-offset-4 hover:text-brand">Tip a repo &rarr;</Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {tips.map((t: any) => {
                const hash = typeof t.tx_hash === "string" ? t.tx_hash : "";
                const onChain = /^0x[0-9a-fA-F]{64}$/.test(hash);
                return (
                <li key={t.id} className="flex items-center gap-3 rounded-[10px] border border-border px-4 py-3">
                  <Link href={`/${t.repo_id}`} className="shrink-0" aria-label={capitalize(t.repo_id.split("/")[1] || t.repo_id)}>
                    <RepoIcon repoId={t.repo_id} logo={t.icon} loadDeveloperPfp />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm">
                        <span className="font-mono text-xs">{t.display_name || truncate(t.tipper_address)}</span>
                        {" tipped "}
                        <Link href={`/${t.repo_id}`} className="font-medium text-brand">{capitalize(t.repo_id.split("/")[1])}</Link>
                      </p>
                      <span className="font-mono text-xs tabular-nums text-brand">+{(Number(t.amount) / Math.pow(10, getTokenDecimals(t.token))).toFixed(2)} {getTokenSymbol(t.token)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {onChain ? (
                        <a href={getBasescanTxUrl(hash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[11px] hover:text-brand">
                          {truncate(hash)} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-[11px]">{hash ? truncate(hash) : "—"}</span>
                      )}
                      <span className="ml-auto">{timeAgo(t.timestamp)}</span>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {page}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <Button variant="ghost" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
