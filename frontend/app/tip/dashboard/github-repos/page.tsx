"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { Search } from "lucide-react";

const PAGE_SIZE = 20;

export default function DashboardGithubRepos() {
  const { status } = useSession();
  const [repos, setRepos] = useState<any[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/github/repos?per_page=100").then(r => r.json()).then(j => {
      if (Array.isArray(j)) { setRepos(j); setNotice(null); }
      else { setRepos(Array.isArray(j?.repos) ? j.repos : []); setNotice(typeof j?.error === "string" ? j.error : null); }
    }).catch(() => setRepos([])).finally(() => setLoading(false));
  }, [status]);

  const filtered = useMemo(() => {
    if (!search) return repos;
    const q = search.toLowerCase();
    return repos.filter(r => r.full_name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q));
  }, [repos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  if (status === "loading") return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">GitHub repos</h1>
        {!loading && repos.length > 0 && (
          <div className="relative w-full max-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repos..." className="h-9 w-full bg-transparent rounded-[10px] border border-border pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader variant="dots" size={20} /></div>
      ) : repos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{notice || "No repos found."}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No repos match &ldquo;{search}&rdquo;</p>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {paged.map((r: any) => (
              <li key={r.full_name} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Image src={r.avatar_url} alt={r.owner} width={32} height={32} className="rounded-sm" />
                  <div>
                    <div className="font-mono text-sm">{r.full_name}</div>
                    {r.description && <div className="text-xs text-muted-foreground truncate max-w-[40ch]">{r.description}</div>}
                  </div>
                </div>
                <Link href={`/tip/${r.full_name}`} className="text-sm underline underline-offset-4 text-foreground/80">View</Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">{filtered.length} repos · page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
