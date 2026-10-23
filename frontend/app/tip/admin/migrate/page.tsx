"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { opentipV2Abi } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { Button, StatefulButton } from "@/components/motion/button";
import { useToast } from "@/app/providers";
import { Loader } from "@/components/motion/loader";

export default function AdminMigratePage() {
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const { showToast } = useToast();
  const contract = CONTRACT_ADDRESS;

  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState<string | null>(null);
  const [migrateState, setMigrateState] = useState<"idle"|"loading"|"success"|"error">("idle");

  const migrateW = useWriteContract();
  const migrateReceipt = useWaitForTransactionReceipt({ hash: migrateW.data });

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/repos")
      .then((r) => r.json())
      .then((j) => setRepos(Array.isArray(j) ? j : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (migrateReceipt.isSuccess) {
      setMigrateState("success");
      showToast({ status: "success", title: "Repo migrated", description: migrating });
      setTimeout(() => { setMigrateState("idle"); setMigrating(null); }, 2000);
    }
    if (migrateReceipt.isError) {
      setMigrateState("error");
      showToast({ status: "error", title: "Migration failed" });
      setTimeout(() => { setMigrateState("idle"); setMigrating(null); }, 2000);
    }
  }, [migrateReceipt.isSuccess, migrateReceipt.isError]);

  const onMigrate = (repoId: string, payoutAddress: string) => {
    if (!contract) return;
    setMigrating(repoId);
    setMigrateState("loading");
    migrateW.writeContract({
      address: contract,
      abi: opentipV2Abi,
      functionName: "adminMigrateRepo",
      args: [repoId, payoutAddress as `0x${string}`],
    });
  };

  if (!contract) return <div className="py-12 text-sm text-muted-foreground">Contract not configured.</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-tight">Migrate Repos (v1 → v2)</h1>
      <p className="text-sm text-muted-foreground max-w-lg">
        Migrate repos from the v1 contract to v2. This registers each repo on the v2 contract so it can receive multi-token tips.
        Existing v1 USDC balances remain claimable from v1.
      </p>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>
      ) : repos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No repos found.</p>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Repo</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Payout Address</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Tips</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((repo) => (
                <tr key={repo.repoId} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{repo.repoId}</td>
                  <td className="px-4 py-2 font-mono text-xs">{repo.payoutAddress?.slice(0, 6)}...{repo.payoutAddress?.slice(-4)}</td>
                  <td className="px-4 py-2 text-right text-xs">{repo.tipCount}</td>
                  <td className="px-4 py-2 text-right">
                    {isConnected ? (
                      <StatefulButton
                        state={migrateState === "loading" && migrating === repo.repoId ? "loading" : "idle"}
                        onClick={() => onMigrate(repo.repoId, repo.payoutAddress)}
                        disabled={migrating !== null}
                        variant="secondary"
                        className="text-xs h-7"
                      >
                        Migrate
                      </StatefulButton>
                    ) : (
                      <Button variant="secondary" onClick={() => open()} className="text-xs h-7">Connect</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
