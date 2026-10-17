import Link from "next/link";
import InstallModal from "@/components/InstallModal";
import Footer from "@/components/Footer";
import { UrlSwap } from "@/components/ledger/UrlSwap";
import { SplitBar } from "@/components/ledger/SplitBar";
import { NumberTicker } from "@/components/ledger/NumberTicker";
import { getHomeLedger } from "@/lib/home-ledger";
import { bpsLabel, readFeeBps } from "@/lib/fee-bps";
import type { ReactNode } from "react";
import { CONTRACT_ADDRESS } from "@/lib/chain";

const steps = [
  ["01", "Swap one word in the URL.", "Replace github.com with opentip.tech on any repo link to open its tip page."],
  ["02", "Tip it in a supported token.", "Connect a wallet, choose an amount in ETH or USDC, and confirm. No account required. OAR is coming soon."],
  ["03", "Maintainers claim on their schedule.", "The balance belongs to the maintainer the moment a tip lands. They withdraw whenever they choose."],
];

const faqs = [
  ["Do I need an account to tip a repo?", "No. Connect a wallet, choose ETH or USDC, and confirm. Tipping does not require an Opentip account."],
  ["If I send ETH, does the maintainer receive ETH?", "Yes. A contribution stays in the token you send. ETH is claimable as ETH, and USDC as USDC."],
  ["What chain does this run on?", "Base. Contributions, claims, and fees are on the public record."],
  ["Can anyone claim any repo’s tips?", "No. Claiming requires the payout wallet registered for that repo. Registration happens after a maintainer signs in with GitHub and Opentip verifies ownership or maintainer access."],
  ["Has the contract been audited?", "The contract is public and verifiable. Read the source and the on-chain record before you send a tip."],
  ["What happens if a repo changes owner?", "The payout address does not follow GitHub on its own. The registered wallet can update it, and Opentip can reassign it after the new maintainer verifies access."],
  ["Isn’t the contract centralized?", "An owner key can pause tipping, registrations, payout-address updates, and claims; set the fee to any rate up to a hard 10% cap; and reassign a payout address. It cannot withdraw a maintainer’s pending balance — only the current payout address can claim it. The owner can withdraw the separate fee balance. Those actions are public."],
];

export async function HomePage() {
  const [ledger, feeBps] = await Promise.all([getHomeLedger(), readFeeBps()]);
  const feeKnown = feeBps != null;
  const fee = feeKnown ? feeBps : 0;
  const maintainer = feeKnown ? 10000 - fee : 0;
  const feeText = bpsLabel(fee);
  const maintainerText = bpsLabel(maintainer);
  const explorerHost = process.env.NEXT_PUBLIC_CHAIN === "base" ? "https://basescan.org" : "https://sepolia.basescan.org";
  const contract = CONTRACT_ADDRESS;

  return (
    <>
      <InstallModal />
      <div className="mx-auto w-full max-w-[1120px] px-4 py-8">
        <section className="grid min-w-0 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-6 pt-2">
            <h1 className="font-display text-[2.7rem] font-extrabold leading-[0.92] text-balance sm:text-6xl lg:text-[4.4rem]">
              Funding for open source, from the <span className="text-brand">open market.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Turn any GitHub repo into a tip page. Tip maintainers in ETH or USDC. Maintainers claim whenever they want. OAR is coming soon.
            </p>
            <UrlSwap />
            <p className="text-sm text-muted-foreground">Swap one word in any repo link. Paste owner/repo or a full GitHub URL.</p>
          </div>
          <aside className="min-w-0 rounded-[10px] border border-border bg-card p-4 shadow-[0_18px_50px_-32px_rgba(11,13,12,0.45)] sm:p-5">
            <p className="text-sm font-medium">{ledger?.project ?? "No tips yet"}</p>
            <p className="mt-5 text-xs text-muted-foreground">Total tipped</p>
            <p className="mt-1 font-mono text-4xl tracking-tight">
              <NumberTicker value={ledger?.fundedUsd ?? 0} />
            </p>
            {feeKnown ? (
              <div className="mt-4 flex flex-col gap-2">
                <SplitBar maintainerBps={maintainer} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{maintainerText}% maintainers</span>
                  <span>{feeText}% fee</span>
                </div>
              </div>
            ) : null}
            {ledger && ledger.tips.length > 0 ? (
              <ul className="mt-4 divide-y divide-border">
                {ledger.tips.map((row) => (
                  <li key={row.id} className="grid grid-cols-[minmax(0,1.15fr)_auto_minmax(0,0.8fr)_auto] items-center gap-x-2 py-2.5 text-sm sm:gap-x-3">
                    <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{row.name}</span>
                    <span className="whitespace-nowrap font-mono text-xs text-brand tabular-nums">+{row.amount} {row.symbol}</span>
                    <span className="min-w-0 truncate text-xs text-foreground">{row.repo}</span>
                    <span className="whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground">{row.when}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Indexed tips will show up here.</p>
            )}
          </aside>
        </section>

        <section className="mt-8 grid overflow-hidden rounded-[10px] border border-border sm:grid-cols-2 lg:grid-cols-4">
          {[
            [`${maintainerText}%`, "to maintainers"],
            [`${feeText}%`, "platform fee, 10% hard cap"],
            ["$1", "minimum per contribution"],
            ["0 accounts", "needed to tip"],
          ].map(([value, label], index) => (
            <div key={label} className={`border-border px-5 py-5 ${index < 3 ? "border-b sm:border-b lg:border-b-0 lg:border-r" : ""}`}>
              <p className="font-mono text-2xl tabular-nums">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 grid gap-10 lg:grid-cols-3">
          {steps.map(([n, title, body]) => (
            <article key={n} className="flex flex-col gap-2">
              <p className="font-mono text-sm text-brand">{n}</p>
              <h2 className="text-lg font-medium">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl sm:text-4xl">Built for trust</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Trust n="01" title="Non-custodial by design." body="Tips never sit in an Opentip account. Only the registered payout wallet can withdraw a maintainer’s balance." />
            <Trust n="02" title="ETH and USDC today." body="Accept ETH or USDC with no extra setup. OAR is coming soon." />
            <Trust n="03" title="Fully verifiable." body="Every contribution, claim, and fee is on the public record.">
              {contract ? (
                <a className="mt-3 block font-mono text-xs break-all text-brand hover:underline" href={`${explorerHost}/address/${contract}`} target="_blank" rel="noreferrer">
                  {contract}
                </a>
              ) : null}
            </Trust>
            <Trust n="04" title="Transparent pricing." body={`A platform fee of ${feeText}%, capped at 10%. Maintainers receive ${maintainerText}% of every contribution.`} />
          </div>
        </section>

        <section className="mt-16 grid items-center gap-6 rounded-[10px] border border-border p-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">Turn your repo into a tip page</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Sign in with GitHub, verify ownership or maintainer access, and link a wallet. Setup takes about a minute. Your repo then accepts tips at opentip.tech/owner/repo.
            </p>
            <Link href="/onboarding" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-white hover:bg-[hsl(var(--accent-hover))]">
              Register a repo
              <Arrow />
            </Link>
          </div>
          <aside className="rounded-[10px] bg-muted p-5">
            <p className="font-mono text-sm">
              <span className="text-brand">opentip.tech/</span>owner/repo
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Anyone can tip the page. You claim the balance whenever you choose.</p>
          </aside>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">FAQ</h2>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {faqs.map(([q, a], index) => (
              <details key={q} open={index === 0} className="group py-3">
                <summary className="cursor-pointer list-none text-base font-medium">
                  <h3 className="inline">{q}</h3>
                </summary>
                <p className="pb-2 pt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
      <Footer force />
    </>
  );
}

function Trust({ n, title, body, children }: { n: string; title: string; body: string; children?: ReactNode }) {
  return (
    <article className="rounded-[10px] border border-border p-4">
      <p className="font-mono text-xs text-muted-foreground">{n}</p>
      <h3 className="mt-2 font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {children}
    </article>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
      <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
