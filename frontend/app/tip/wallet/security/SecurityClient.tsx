"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import Modal from "@/components/motion/modal";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { Info, Trash2, Plus } from "lucide-react";

interface Policy {
  pauseAll: boolean;
  allowArbitraryCalls: boolean;
  dailyLimitUsd: number;
  dailyLimitEnabled: boolean;
  perTxLimitUsd: number;
  perTxLimitEnabled: boolean;
  permittedRecipientsEnabled: boolean;
  permittedRecipients: { address: string; label?: string }[];
}

const DEFAULTS: Policy = {
  pauseAll: false,
  allowArbitraryCalls: true,
  dailyLimitUsd: 1000,
  dailyLimitEnabled: true,
  perTxLimitUsd: 500,
  perTxLimitEnabled: true,
  permittedRecipientsEnabled: false,
  permittedRecipients: [],
};

function truncate(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-foreground" : "bg-border"}`}
    >
      <span
        className={`block w-5 h-5 m-0.5 rounded-full bg-card transition-transform ${on ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

function Section({
  title,
  desc,
  on,
  onToggle,
  children,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium text-sm">{title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </div>
        <Toggle on={on} onClick={onToggle} label={title} />
      </div>
      {on && children}
    </section>
  );
}

export default function SecurityClient() {
  const { showToast } = useToast();
  const [policy, setPolicy] = useState<Policy>({ ...DEFAULTS });
  const [spent, setSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    fetch("/api/wallet/policy")
      .then((r) => r.json())
      .then((j) => {
        if (j.policy) setPolicy({ ...DEFAULTS, ...j.policy });
        if (typeof j.spentTodayUsd === "number") setSpent(j.spentTodayUsd);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (next: Policy, key: string) => {
    setSaving(key);
    try {
      const res = await fetch("/api/wallet/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setPolicy({ ...DEFAULTS, ...j.policy });
      if (typeof j.spentTodayUsd === "number") setSpent(j.spentTodayUsd);
      showToast({ status: "success", title: "Saved" });
    } catch (e: any) {
      showToast({ status: "error", title: "Save failed", description: e.message?.slice(0, 120) });
    }
    setSaving(null);
  };

  const set = (patch: Partial<Policy>) => setPolicy((p) => ({ ...p, ...patch }));
  const savingLabel = (key: string, fallback: string) => (saving === key ? "Saving..." : fallback);

  const addRecipient = (address: string, label?: string) => {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      showToast({ status: "error", title: "Invalid address" });
      return;
    }
    const lower = address.toLowerCase();
    if (policy.permittedRecipients.some((r) => r.address.toLowerCase() === lower)) return;
    set(({
      permittedRecipients: [...policy.permittedRecipients, label ? { address: lower, label } : { address: lower }],
    } as Partial<Policy>));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
        <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl">Security</h1>
        <p className="text-sm text-muted-foreground mt-1">Spending controls for your Opentip Smart Wallet. External wallets sign in their own apps and aren&apos;t covered.</p>
      </div>

      <Section
        title="Pause all transactions"
        desc="Block every outbound transaction (tips, sends, claims). Use this if you suspect your wallet is compromised."
        on={policy.pauseAll}
        onToggle={() => { const n = { ...policy, pauseAll: !policy.pauseAll }; set(n); save(n, "pause"); }}
      />

      <Section
        title="Enable arbitrary contract calls"
        desc="Allow raw contract interactions. When off, your wallet may only talk to the Opentip contract and the supported tokens."
        on={policy.allowArbitraryCalls}
        onToggle={() => { const n = { ...policy, allowArbitraryCalls: !policy.allowArbitraryCalls }; set(n); save(n, "arbitrary"); }}
      />

      <Section
        title="Daily spending limit"
        desc="Cumulative outflow USD across all transactions in any rolling 24-hour window."
        on={policy.dailyLimitEnabled}
        onToggle={() => { const n = { ...policy, dailyLimitEnabled: !policy.dailyLimitEnabled }; set(n); save(n, "daily-toggle"); }}
      >
        <p className="text-xs text-foreground/80">Spent today: ${spent.toFixed(2)} / ${Number(policy.dailyLimitUsd).toFixed(2)}</p>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Limit $</label>
            <Input
              value={String(policy.dailyLimitUsd)}
              onChange={(v) => set({ dailyLimitUsd: Number(v) || 0 })}
              placeholder="1000"
            />
          </div>
          <Button size="sm" onClick={() => save(policy, "daily")} disabled={saving !== null}>{savingLabel("daily", "Save")}</Button>
        </div>
      </Section>

      <Section
        title="Per-transaction limit"
        desc="Block any single transaction above this USD value."
        on={policy.perTxLimitEnabled}
        onToggle={() => { const n = { ...policy, perTxLimitEnabled: !policy.perTxLimitEnabled }; set(n); save(n, "pertx-toggle"); }}
      >
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Limit $</label>
            <Input
              value={String(policy.perTxLimitUsd)}
              onChange={(v) => set({ perTxLimitUsd: Number(v) || 0 })}
              placeholder="500"
            />
          </div>
          <Button size="sm" onClick={() => save(policy, "pertx")} disabled={saving !== null}>{savingLabel("pertx", "Save")}</Button>
        </div>
      </Section>

      <Section
        title="Permitted recipients"
        desc="When enabled, transfers can only target addresses on this list."
        on={policy.permittedRecipientsEnabled}
        onToggle={() => { const n = { ...policy, permittedRecipientsEnabled: !policy.permittedRecipientsEnabled }; set(n); save(n, "recipients-toggle"); }}
      >
        <div className="flex gap-2 items-center">
          <Button size="sm" variant="secondary" onClick={() => addRecipient(CONTRACT_ADDRESS || "", "Opentip")}>
            <Plus className="h-3.5 w-3.5" /> Add Opentip contract
          </Button>
          <button onClick={() => setShowWhy(true)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Why add the Opentip contract?">
            <Info className="h-4 w-4" />
          </button>
        </div>
        {policy.permittedRecipients.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recipients yet. Nothing can be sent while this list is on and empty.</p>
        ) : (
          <ul className="space-y-1">
            {policy.permittedRecipients.map((r) => (
              <li key={r.address} className="flex items-center justify-between rounded-[10px] border border-border px-2 py-1.5">
                <span className="stats text-xs text-foreground/80">
                  {truncate(r.address)}{r.label ? ` · ${r.label}` : ""}
                </span>
                <button
                  onClick={() => {
                    const n = { ...policy, permittedRecipients: policy.permittedRecipients.filter((x) => x.address !== r.address) };
                    set(n); save(n, "recipients");
                  }}
                  className="text-muted-foreground hover:text-red-600 transition-colors"
                  aria-label="Remove recipient"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Address</label>
            <Input value={newAddr} onChange={setNewAddr} placeholder="0x..." />
          </div>
          <div className="w-28">
            <label className="text-xs text-muted-foreground">Label (optional)</label>
            <Input value={newLabel} onChange={setNewLabel} placeholder="Cold wallet" />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              addRecipient(newAddr.trim(), newLabel.trim() || undefined);
              setNewAddr(""); setNewLabel("");
            }}
          >
            Add
          </Button>
        </div>
        <div>
          <Button size="sm" onClick={() => save(policy, "recipients")} disabled={saving !== null}>{savingLabel("recipients", "Save")}</Button>
        </div>
      </Section>

      <Modal open={showWhy} onClose={() => setShowWhy(false)} title="Why add the Opentip contract?">
        <p className="text-xs text-muted-foreground">
          Tipping, claiming, and registering all talk to the Opentip smart contract. While permitted recipients is on, any destination not on your list — including Opentip itself — is blocked. Add it here so tips and claims keep working under lockdown.
        </p>
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            addRecipient(CONTRACT_ADDRESS || "", "Opentip");
            setShowWhy(false);
          }}
        >
          Add Opentip contract
        </Button>
      </Modal>
    </div>
  );
}
