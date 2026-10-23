"use client";
import { useState, useEffect } from "react";
import { Loader } from "@/components/motion/loader";

type Totals = { txs: number; usd: number };
type Data = {
  totals: { day: Totals; week: Totals; month: Totals };
  perDay: { date: string; txs: number; usd: number }[];
  topUsers: { label: string; txs: number; usd: number }[];
  circuitHealthy: boolean;
  recent: { id: string; createdAt: string; user: string; kind: string; status: string; txHash: string | null; gasUsd: number }[];
};

const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Stat({ label, v }: { label: string; v: Totals }) {
  return (
    <div className="min-w-0 rounded-[10px] border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="stats mt-1 break-words text-xl font-medium leading-tight tracking-tight text-foreground sm:text-2xl">{fmtUsd(v.usd)}</div>
      <div className="mt-1 text-xs text-muted-foreground">{v.txs} sponsored txs</div>
    </div>
  );
}

export default function AdminSponsorship() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/sponsorship")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;
  if (!data) return <div className="py-20 text-center text-sm text-muted-foreground">Failed to load sponsorship data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl tracking-tight">Sponsorship</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${data.circuitHealthy ? "bg-emerald-700" : "bg-red-700"}`}>
          {data.circuitHealthy ? "Paymaster healthy" : "Paymaster down"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Last 24h" v={data.totals.day} />
        <Stat label="Last 7 days" v={data.totals.week} />
        <Stat label="Last 30 days" v={data.totals.month} />
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">Daily spend</div>
        <table className="w-full text-sm">
          <tbody>
            {data.perDay.map((d) => (
              <tr key={d.date} className="border-b border-border last:border-0">
                <td className="px-4 py-2 stats text-xs">{d.date}</td>
                <td className="px-4 py-2 text-right stats text-xs">{d.txs} txs</td>
                <td className="px-4 py-2 text-right stats text-xs">{fmtUsd(d.usd)}</td>
              </tr>
            ))}
            {data.perDay.length === 0 && (
              <tr><td className="px-4 py-3 text-xs text-muted-foreground">No sponsored transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">Top users by spend</div>
        <table className="w-full text-sm">
          <tbody>
            {data.topUsers.map((u) => (
              <tr key={u.label} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-xs font-medium">{u.label}</td>
                <td className="px-4 py-2 text-right stats text-xs">{u.txs} txs</td>
                <td className="px-4 py-2 text-right stats text-xs">{fmtUsd(u.usd)}</td>
              </tr>
            ))}
            {data.topUsers.length === 0 && (
              <tr><td className="px-4 py-3 text-xs text-muted-foreground">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">Recent sponsored transactions</div>
        <table className="w-full text-sm">
          <tbody>
            {data.recent.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs font-medium">{r.user}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{r.kind} · {r.status}</td>
                <td className="px-4 py-2 text-right stats text-xs">{fmtUsd(r.gasUsd)}</td>
              </tr>
            ))}
            {data.recent.length === 0 && (
              <tr><td className="px-4 py-3 text-xs text-muted-foreground">No transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
