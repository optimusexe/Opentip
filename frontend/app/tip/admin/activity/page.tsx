"use client";
import { useState, useEffect } from "react";
import { Loader } from "@/components/motion/loader";
import { getBasescanTxUrl } from "@/lib/basescan";
import { getTokenSymbol, getTokenDecimals } from "@/lib/chain";

function formatAmount(raw: number | string, token: string): string {
  const num = typeof raw === "string" ? Number(raw) : raw;
  const decimals = getTokenDecimals(token);
  const val = num / Math.pow(10, decimals);
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminActivity() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/tips?page=${page}&limit=50`)
      .then((r) => r.json())
      .then((j) => {
        setTips(j.tips || []);
        setTotalPages(j.pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-tight">Activity</h1>

      <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipper</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Repo</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Token</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Fee</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Tx</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((tip, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{truncate(tip.tipper_address)}</td>
                <td className="px-4 py-2 font-mono text-xs">{tip.repo_id}</td>
                <td className="px-4 py-2 text-right stats text-xs">{formatAmount(tip.amount, tip.token)}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{getTokenSymbol(tip.token)}</td>
                <td className="px-4 py-2 text-right stats text-xs text-muted-foreground">{formatAmount(tip.fee_amount, tip.token)}</td>
                <td className="px-4 py-2 text-right">
                  <a
                    href={getBasescanTxUrl(tip.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline font-mono"
                  >
                    {tip.tx_hash?.slice(0, 8)}...
                  </a>
                </td>
                <td className="px-4 py-2 text-right text-xs text-muted-foreground">{new Date(tip.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-border rounded-[10px] disabled:opacity-40 hover:bg-muted"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border border-border rounded-[10px] disabled:opacity-40 hover:bg-muted"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
