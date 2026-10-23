import Link from "next/link";
import { formatAmount } from "@/lib/formatAmount";
import { getBasescanTxUrl } from "@/lib/basescan";
import { receiptHeadline } from "@/lib/receipt-display";
import type { ReceiptLeg } from "@/lib/receipt";

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

export function ReceiptCard({
  kind,
  project,
  repoId,
  from,
  txHash,
  timestamp,
  legs,
  network,
  prices = {},
}: {
  kind: "fund" | "claim";
  project: string;
  repoId: string;
  from?: string;
  txHash?: string;
  timestamp?: string;
  legs: ReceiptLeg[];
  network: string;
  prices?: Record<string, number>;
}) {
  const headline = receiptHeadline(kind, legs, prices);

  return (
    <article className="mx-auto w-full max-w-md">
      <div className="rounded-t-[10px] border border-b-0 border-border bg-card px-5 pb-4 pt-5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>Receipt</span>
          <span className="font-mono normal-case tracking-normal">{network}</span>
        </div>
        {headline.mode === "usd" ? (
          <div className="mt-4">
            <p className="font-mono text-5xl leading-none tracking-tight tabular-nums">{headline.usd}</p>
            <p className="mt-3 text-sm text-muted-foreground">{headline.breakdown}</p>
          </div>
        ) : headline.mode === "stacked" ? (
          <div className="mt-4 flex flex-col gap-2">
            {headline.lines.map((line, index) => (
              <div key={`${line.token}-${index}`} className="flex items-end gap-3">
                <p className="font-mono text-5xl leading-none tracking-tight tabular-nums">{line.amount}</p>
                <p className="pb-1 text-sm text-muted-foreground">{line.symbol}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex items-end gap-3">
            <p className="font-mono text-5xl leading-none tracking-tight tabular-nums">
              {headline.mode === "single" ? headline.amount : "—"}
            </p>
            {headline.mode === "single" ? <p className="pb-1 text-sm text-muted-foreground">{headline.symbol}</p> : null}
          </div>
        )}
        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">{kind === "claim" ? "Claimed from" : "→"} </span>
          <Link href={`/tip/${repoId}`} className="font-medium hover:text-brand">
            {project}
          </Link>
        </p>
      </div>
      <div className="relative border-x border-dashed border-border bg-card">
        <span className="absolute -left-3 top-0 size-6 -translate-y-1/2 rounded-full border border-border bg-background" />
        <span className="absolute -right-3 top-0 size-6 -translate-y-1/2 rounded-full border border-border bg-background" />
      </div>
      <div className="border-x border-border bg-card px-5 py-4">
        <dl className="flex flex-col gap-2.5 text-sm">
          {kind === "claim"
            ? legs.map((leg, index) => (
                <Row key={`${leg.token}-${index}`} label="Claimed" value={withSymbol(leg.maintainer, leg)} />
              ))
            : legs.map((leg, index) => {
                const maintainerPct = percent(leg.maintainer, leg.amount);
                const feePct = percent(leg.fee, leg.amount);
                const suffix = legs.length > 1 ? ` · ${leg.symbol}` : "";
                return (
                  <LegRows
                    key={`${leg.token}-${index}`}
                    maintainerLabel={`Maintainers · ${maintainerPct}%${suffix}`}
                    feeLabel={`Platform fee · ${feePct}%${suffix}`}
                    maintainer={withSymbol(leg.maintainer, leg)}
                    fee={withSymbol(leg.fee, leg)}
                  />
                );
              })}
          <Row label="Network" value={network} />
          <Row label="From" value={from ? shortAddr(from) : "—"} />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Tx</dt>
            <dd className="font-mono text-[13px] tabular-nums">
              {txHash && HASH_RE.test(txHash) ? (
                <a href={getBasescanTxUrl(txHash)} className="text-brand hover:underline" target="_blank" rel="noreferrer">
                  {shortAddr(txHash)} ↗
                </a>
              ) : (
                txHash ? shortAddr(txHash) : "—"
              )}
            </dd>
          </div>
          <Row label="Time" value={timestamp ? formatStamp(timestamp) : "—"} />
        </dl>
      </div>
      <div className="receipt-scallop h-3 border-x border-border" />
    </article>
  );
}

function LegRows({
  maintainerLabel,
  feeLabel,
  maintainer,
  fee,
}: {
  maintainerLabel: string;
  feeLabel: string;
  maintainer: string;
  fee: string;
}) {
  return (
    <>
      <Row label={maintainerLabel} value={maintainer} />
      <Row label={feeLabel} value={fee} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-[13px] tabular-nums">{value}</dd>
    </div>
  );
}

function human(raw: string, token: string) {
  return formatAmount(raw, token) ?? "0";
}

function withSymbol(raw: string, leg: ReceiptLeg) {
  return `${human(raw, leg.token)} ${leg.symbol}`;
}

function percent(part: string, whole: string) {
  try {
    const p = BigInt(part);
    const w = BigInt(whole);
    if (w <= 0n) return "0";
    const n = Number((p * 10000n) / w) / 100;
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
  } catch {
    return "0";
  }
}

function shortAddr(value: string) {
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function formatStamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
