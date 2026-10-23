"use client";
import { useEffect, useState } from "react";
import { Loader } from "@/components/motion/loader";
import { getTokenSymbol, getTokenDecimals, ETH_ADDRESS, USDC_ADDRESS, OAR_ADDRESS } from "@/lib/chain";
import { TokenLogo } from "@/components/ledger/TokenLogo";
import { fmtUsd } from "@/lib/prices";

interface Stats {
  totalTipsAmount: string;
  totalFeesAmount: string;
  totalTipCount: number;
  totalRepos: number;
  totalUsers: number;
  tokenTotals: { token: string; total: string; fees: string }[];
  treasuryBalances: Record<string, string>;
  recentTips: any[];
}

function formatAmount(raw: number | string, token?: string): string {
  const num = typeof raw === "string" ? Number(raw) : raw;
  const decimals = getTokenDecimals(token);
  const val = num / Math.pow(10, decimals);
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => {
        // Never let a stale/partial response wipe balances we already have
        // (overlapping fetches under StrictMode + flaky RPC did exactly that).
        setStats((prev) => {
          if (
            prev &&
            Object.keys(prev.treasuryBalances || {}).length > 0 &&
            Object.keys(j?.treasuryBalances || {}).length === 0
          ) {
            return { ...j, treasuryBalances: prev.treasuryBalances };
          }
          return j;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/prices").then((r) => r.json()).then(setPrices).catch(() => {});
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;
  if (!stats || (stats as any).error || !Array.isArray(stats.recentTips)) return <div className="py-20 text-sm text-muted-foreground">Failed to load stats</div>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl tracking-tight">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total tips" value={String(stats.totalTipCount)} />
        <StatCard label="Registered repos" value={String(stats.totalRepos)} />
        <StatCard label="Users" value={String(stats.totalUsers)} />
        {(() => {
          const totalUsd = stats.tokenTotals.reduce((sum, t) => {
            const decimals = getTokenDecimals(t.token);
            const amount = Number(t.total || 0) / Math.pow(10, decimals);
            const price = prices[t.token?.toLowerCase()] ?? 0;
            return sum + amount * price;
          }, 0);
          return <StatCard label="Volume (USD)" value={fmtUsd(totalUsd)} />;
        })()}
        {[ETH_ADDRESS, USDC_ADDRESS, OAR_ADDRESS].map((addr) => {
          const t = stats.tokenTotals.find((x) => x.token.toLowerCase() === addr.toLowerCase());
          const price = prices[addr.toLowerCase()] ?? 0;
          const symbol = getTokenSymbol(addr);
          return (
            <StatCard key={addr} label={`${symbol} tipped`} value={t ? formatAmount(t.total, t.token) : "0"} sub={price > 0 ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}/${symbol}` : undefined} />
          );
        })}
      </div>

      {/* Token breakdown */}
      {stats.tokenTotals.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-xl">Volume by token</h2>
          <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Token</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total Tipped</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Fees</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">USD Value</th>
                </tr>
              </thead>
              <tbody>
                {stats.tokenTotals
                  .filter((t) => [ETH_ADDRESS, USDC_ADDRESS, OAR_ADDRESS].some((a) => a.toLowerCase() === t.token.toLowerCase()))
                  .map((t) => {
                    const decimals = getTokenDecimals(t.token);
                    const amount = Number(t.total || 0) / Math.pow(10, decimals);
                    const price = prices[t.token?.toLowerCase()] ?? 0;
                    return (
                      <tr key={t.token} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 text-xs font-medium"><span className="inline-flex items-center gap-2"><TokenLogo symbol={getTokenSymbol(t.token)} />{getTokenSymbol(t.token)}</span></td>
                        <td className="px-4 py-2 text-right stats text-xs">{formatAmount(t.total, t.token)} {getTokenSymbol(t.token)}</td>
                        <td className="px-4 py-2 text-right stats text-xs text-muted-foreground">{formatAmount(t.fees, t.token)} {getTokenSymbol(t.token)}</td>
                        <td className="px-4 py-2 text-right stats text-xs">{fmtUsd(amount * price)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Treasury balances */}
      {Object.keys(stats.treasuryBalances).length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-xl">Treasury balances</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(stats.treasuryBalances).map(([addr, bal]) => {
              const symbol = getTokenSymbol(addr);
              const decimals = getTokenDecimals(addr);
              const formatted = Number(bal) / Math.pow(10, decimals);
              const price = prices[addr.toLowerCase()] ?? 0;
              const usd = formatted * price;
              return (
                <div key={addr} className="min-w-0 rounded-[10px] border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><TokenLogo symbol={symbol} />{symbol}</div>
                  <div className="stats mt-2 break-words text-xl leading-tight tracking-tight text-foreground sm:text-2xl">{formatted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                  {price > 0 && <div className="mt-1 text-xs text-muted-foreground">{fmtUsd(usd)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h2 className="mb-4 font-display text-xl">Recent tips</h2>
        {stats.recentTips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tips yet</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipper</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Repo</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Token</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Fee</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTips.map((tip, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{truncate(tip.tipper_address)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{tip.repo_id}</td>
                    <td className="px-4 py-2 text-right stats text-xs">{formatAmount(tip.amount, tip.token)}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{getTokenSymbol(tip.token)}</td>
                    <td className="px-4 py-2 text-right stats text-xs text-muted-foreground">{formatAmount(tip.fee_amount, tip.token)}</td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">{new Date(tip.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-[10px] border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="stats mt-2 break-words text-xl leading-tight tracking-tight text-foreground sm:text-2xl">
        {value}
      </div>
      {sub && <div className="mt-1 break-words text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
