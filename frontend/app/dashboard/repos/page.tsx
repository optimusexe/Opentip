"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { RepoIcon } from "@/components/RepoIcon";
import { useAccount, useReadContracts } from "wagmi";
import { opentipV2Abi } from "@/lib/contract";
import { CONTRACT_ADDRESS, CHAIN_ID, USDC_ADDRESS, ETH_ADDRESS, OAR_ADDRESS, getTokenDecimals, capitalize } from "@/lib/chain";
import { fmtUsd } from "@/lib/prices";

export default function DashboardRepos() {
  const { status } = useSession();
  const { address } = useAccount();
  const contract = CONTRACT_ADDRESS;
  const [registeredRepos, setRegisteredRepos] = useState<any[]>([]);
  const [loadingRegistered, setLoadingRegistered] = useState(true);
  const [prices, setPrices] = useState<Record<string, number>>({});

  const tokens = [USDC_ADDRESS, ETH_ADDRESS, OAR_ADDRESS];
  const onChainContracts = contract && registeredRepos.length > 0 ? registeredRepos.flatMap((r: any) =>
    tokens.flatMap((token) => [
      { address: contract, abi: opentipV2Abi, functionName: "getPendingBalance" as const, args: [r.repo_id, token], chainId: CHAIN_ID },
      { address: contract, abi: opentipV2Abi, functionName: "getTotalTipped" as const, args: [r.repo_id, token], chainId: CHAIN_ID },
    ])
  ) : [];

  const { data: onChainData } = useReadContracts({ contracts: onChainContracts });

  const onChainMap = useMemo(() => {
    const map: Record<string, { pending: Record<string, bigint>; total: Record<string, bigint> }> = {};
    for (let i = 0; i < registeredRepos.length; i++) {
      const pending: Record<string, bigint> = {};
      const total: Record<string, bigint> = {};
      for (let t = 0; t < tokens.length; t++) {
        const idx = i * tokens.length * 2 + t * 2;
        const pendingResult = onChainData?.[idx];
        const totalResult = onChainData?.[idx + 1];
        pending[tokens[t]] = pendingResult?.status === "success" ? (pendingResult.result as bigint) : 0n;
        total[tokens[t]] = totalResult?.status === "success" ? (totalResult.result as bigint) : 0n;
      }
      map[registeredRepos[i].repo_id] = { pending, total };
    }
    return map;
  }, [onChainData, registeredRepos]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/registered-repos").then(r => r.json()).then(j => Array.isArray(j) ? setRegisteredRepos(j) : setRegisteredRepos([])).catch(() => setRegisteredRepos([])).finally(() => setLoadingRegistered(false));
    fetch("/api/prices").then(r => r.json()).then(setPrices).catch(() => {});
  }, [status]);

  if (status === "loading") return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div>
      <h1 className="font-display text-4xl">Your repos</h1>
      <p className="mt-2 text-sm text-muted-foreground">Claim a pending balance whenever you want.</p>

      {loadingRegistered ? (
        <div className="py-12 flex justify-center"><Loader variant="dots" size={20} /></div>
      ) : registeredRepos.length === 0 ? (
        <div className="mt-6 rounded-[10px] border border-dashed border-border px-4 py-10 text-center">
          <p className="font-medium">No registered repos</p>
          <p className="mt-1 text-sm text-muted-foreground">Visit a repo page to register.</p>
          <Link href="/dashboard/github-repos" className="mt-3 inline-flex text-sm text-brand hover:underline">Register from GitHub</Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {registeredRepos.map((r: any) => {
            const onChain = onChainMap[r.repo_id];
            const isClaimant = address && contract && r.payout_address.toLowerCase() === address.toLowerCase();
            const repoName = capitalize(r.repo_id.split("/")[1] || r.repo_id);

            let pendingUsd = 0;
            let totalUsd = 0;
            if (onChain) {
              for (const token of tokens) {
                const dec = getTokenDecimals(token);
                const price = prices[token.toLowerCase()] ?? 0;
                pendingUsd += Number(formatUnits(onChain.pending[token] ?? 0n, dec)) * price;
                totalUsd += Number(formatUnits(onChain.total[token] ?? 0n, dec)) * price;
              }
            }

            return (
              <li key={r.repo_id} className="rounded-[10px] border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <RepoIcon repoId={r.repo_id} logo={r.icon} size={40} className="size-10" />
                    <div className="min-w-0">
                      <Link href={`/${r.repo_id}`} className="text-sm font-medium hover:text-brand">{repoName}</Link>
                      <p className="mt-1 font-mono text-lg tabular-nums">{fmtUsd(pendingUsd)} pending</p>
                      <p className="text-xs text-muted-foreground">{fmtUsd(totalUsd)} tipped · {r.tip_count} {r.tip_count === 1 ? "tip" : "tips"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/${r.repo_id}/manage`}><Button size="sm" variant="secondary">Manage</Button></Link>
                    {isClaimant && (
                      <Link href={`/${r.repo_id}`}><Button size="sm">Claim</Button></Link>
                    )}
                  </div>
                </div>
                <ul className="mt-3 flex flex-col gap-1 text-sm">
                  {tokens.map((token) => {
                    const decimals = getTokenDecimals(token);
                    const raw = onChain?.pending[token] ?? 0n;
                    const amount = Number(formatUnits(raw, decimals));
                    const price = prices[token.toLowerCase()] ?? 0;
                    const symbol = token === USDC_ADDRESS ? "USDC" : token === ETH_ADDRESS ? "ETH" : "OAR";
                    return (
                      <li key={token} className="flex justify-between gap-3">
                        <span>{symbol}</span>
                        <span className="font-mono text-xs tabular-nums">
                          {amount >= 1 ? amount.toFixed(2) : amount.toFixed(4)}
                          {price > 0 ? ` · ${fmtUsd(amount * price)}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {r.payout_address ? <p className="mt-2 font-mono text-[11px] text-muted-foreground">Payout {r.payout_address}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
