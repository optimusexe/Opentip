"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/motion/button";
import { useToast } from "@/app/providers";
import { USDC_ADDRESS, OAR_ADDRESS, ETH_ADDRESS } from "@/lib/chain";

const TOKEN_OPTIONS = [
  { address: ETH_ADDRESS, symbol: "ETH", decimals: 18 },
  { address: USDC_ADDRESS, symbol: "USDC", decimals: 6 },
  { address: OAR_ADDRESS, symbol: "OAR", decimals: 18 },
];

export default function AdminContract() {
  const { showToast, dismissToast } = useToast();
  const [feeBps, setFeeBps] = useState("");
  const [treasury, setTreasury] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState(USDC_ADDRESS);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [treasuryBalances, setTreasuryBalances] = useState<Record<string, string>>({});
  const [strayEth, setStrayEth] = useState("0");
  const [migrationDeadline, setMigrationDeadline] = useState(0);
  const [sweepAddress, setSweepAddress] = useState("");
  const [deadlineTimestamp, setDeadlineTimestamp] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(j => {
      if (j.treasuryBalances) setTreasuryBalances(j.treasuryBalances);
      if (j.strayEth) setStrayEth(j.strayEth);
      if (j.migrationDeadline) setMigrationDeadline(j.migrationDeadline);
    }).catch(() => {});
  }, []);

  const action = async (key: string, url: string, body: any) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    const toastId = showToast({ status: "loading", title: "Sending transaction...", duration: 0 });
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      dismissToast(toastId);
      if (j.ok) {
        showToast({ status: "success", title: "Transaction sent", description: j.txHash?.slice(0, 16) + "..." });
      } else {
        showToast({ status: "error", title: "Failed", description: j.error });
      }
    } catch (e: any) {
      dismissToast(toastId);
      showToast({ status: "error", title: "Failed", description: e.message });
    }
    setLoading((prev) => ({ ...prev, [key]: false }));
  };

  const withdrawAll = async () => {
    setLoading((prev) => ({ ...prev, withdrawAll: true }));
    const toastId = showToast({ status: "loading", title: "Withdrawing all tokens...", duration: 0 });
    try {
      const res = await fetch("/api/admin/withdraw-all", { method: "POST" });
      const j = await res.json();
      dismissToast(toastId);
      if (j.ok) {
        const count = j.results?.length || 0;
        showToast({ status: "success", title: `${count} token${count !== 1 ? "s" : ""} withdrawn` });
      } else {
        showToast({ status: "error", title: "Failed", description: j.error });
      }
    } catch (e: any) {
      dismissToast(toastId);
      showToast({ status: "error", title: "Failed", description: e.message });
    }
    setLoading((prev) => ({ ...prev, withdrawAll: false }));
  };

  const selectedTokenConfig = TOKEN_OPTIONS.find(t => t.address === withdrawToken) || TOKEN_OPTIONS[1];
  const formattedStrayEth = Number(strayEth) / 1e18;
  const deadlineDate = migrationDeadline > 0 ? new Date(migrationDeadline * 1000) : null;

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="font-display text-3xl tracking-tight">Contract controls</h1>

      {/* Pause / Unpause */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Emergency controls</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => action("pause", "/api/admin/pause", {})} disabled={loading.pause}>
            {loading.pause ? "Sending..." : "Pause contract"}
          </Button>
          <Button onClick={() => action("unpause", "/api/admin/unpause", {})} disabled={loading.unpause}>
            {loading.unpause ? "Sending..." : "Unpause contract"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Pausing stops all tips and claims. Unpausing restores them.</p>
      </section>

      <div className="border-t border-border" />

      {/* Set fee */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Platform fee</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-[160px]">
            <label className="block text-xs text-muted-foreground mb-1">Fee (basis points)</label>
            <input
              type="number"
              value={feeBps}
              onChange={(e) => setFeeBps(e.target.value)}
              placeholder="500"
              min="0"
              max="1000"
              className="w-full border border-border bg-background rounded-[10px] px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
            />
          </div>
          <Button onClick={() => action("setFee", "/api/admin/set-fee", { feeBps: Number(feeBps) })} disabled={loading.setFee || !feeBps}>
            {loading.setFee ? "Sending..." : "Update"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">500 = 5%. Max 1000 (10%).</p>
      </section>

      <div className="border-t border-border" />

      {/* Set treasury */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Treasury address</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">New treasury address</label>
            <input
              type="text"
              value={treasury}
              onChange={(e) => setTreasury(e.target.value)}
              placeholder="0x..."
              className="w-full border border-border bg-background rounded-[10px] px-3 py-1.5 text-sm text-foreground font-mono placeholder:text-muted-foreground outline-none focus:border-accent"
            />
          </div>
          <Button onClick={() => action("setTreasury", "/api/admin/set-treasury", { address: treasury })} disabled={loading.setTreasury || !treasury}>
            {loading.setTreasury ? "Sending..." : "Update"}
          </Button>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Withdraw */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Withdraw treasury</h2>
          <Button variant="secondary" onClick={withdrawAll} disabled={loading.withdrawAll}>
            {loading.withdrawAll ? "Sending..." : "Withdraw all"}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TOKEN_OPTIONS.map(t => {
            const bal = Number(treasuryBalances[t.address.toLowerCase()] || "0") / Math.pow(10, t.decimals);
            return (
              <button
                key={t.address}
                onClick={() => setWithdrawToken(t.address)}
                className={`min-w-0 rounded-[10px] border border-border bg-card p-2 text-left transition-colors ${withdrawToken === t.address ? "border-accent bg-accent/10" : "hover:bg-muted"}`}
              >
                <div className="text-xs text-muted-foreground">{t.symbol}</div>
                <div className="stats break-words text-xs text-foreground">{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-[160px]">
            <label className="block text-xs text-muted-foreground mb-1">Amount ({selectedTokenConfig.symbol})</label>
            <input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-border bg-background rounded-[10px] px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
            />
          </div>
          <Button onClick={() => action("withdraw", "/api/admin/withdraw", { token: withdrawToken, amount: withdrawAmount })} disabled={loading.withdraw || !withdrawAmount}>
            {loading.withdraw ? "Sending..." : "Withdraw"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Sends accumulated fees for the selected token to the treasury address.</p>
      </section>

      <div className="border-t border-border" />

      {/* Stray ETH */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Stray ETH</h2>
        <p className="text-xs text-muted-foreground">
          ETH accidentally sent directly to the contract. Balance: <span className="font-mono">{formattedStrayEth.toFixed(6)} ETH</span>
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">Send to address</label>
            <input
              type="text"
              value={sweepAddress}
              onChange={(e) => setSweepAddress(e.target.value)}
              placeholder="0x..."
              className="w-full border border-border bg-background rounded-[10px] px-3 py-1.5 text-sm text-foreground font-mono placeholder:text-muted-foreground outline-none focus:border-accent"
            />
          </div>
          <Button
            onClick={() => action("sweepStrayEth", "/api/admin/sweep-stray-eth", { address: sweepAddress })}
            disabled={loading.sweepStrayEth || !sweepAddress || formattedStrayEth === 0}
          >
            {loading.sweepStrayEth ? "Sending..." : "Sweep"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Sends all stray ETH to the specified address.</p>
      </section>

      <div className="border-t border-border" />

      {/* Migration deadline */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Migration deadline</h2>
        <p className="text-xs text-muted-foreground">
          Controls when v1→v2 repo migration closes. {deadlineDate
            ? <>Current: <span className="font-mono">{deadlineDate.toUTCString()}</span></>
            : <span className="text-muted-foreground">Open-ended (no deadline set)</span>}
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">Unix timestamp (0 = open-ended)</label>
            <input
              type="number"
              value={deadlineTimestamp}
              onChange={(e) => setDeadlineTimestamp(e.target.value)}
              placeholder={String(Math.floor(Date.now() / 1000))}
              min="0"
              className="w-full border border-border bg-background rounded-[10px] px-3 py-1.5 text-sm text-foreground font-mono placeholder:text-muted-foreground outline-none focus:border-accent"
            />
          </div>
          <Button
            onClick={() => action("setDeadline", "/api/admin/set-migration-deadline", { deadline: Number(deadlineTimestamp) || 0 })}
            disabled={loading.setDeadline || deadlineTimestamp === ""}
          >
            {loading.setDeadline ? "Sending..." : "Set"}
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => action("setDeadline", "/api/admin/set-migration-deadline", { deadline: Math.floor(Date.now() / 1000) })}
            disabled={loading.setDeadline}
          >
            {loading.setDeadline ? "Sending..." : "Disable now"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => action("setDeadline", "/api/admin/set-migration-deadline", { deadline: 0 })}
            disabled={loading.setDeadline}
          >
            {loading.setDeadline ? "Sending..." : "Remove deadline"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Sets the unix timestamp after which migration is no longer allowed. "Disable now" closes migration immediately. "Remove deadline" re-opens it.</p>
      </section>
    </div>
  );
}
