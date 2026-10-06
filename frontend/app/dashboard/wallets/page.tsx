"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { Info, Trash2, Sparkles } from "lucide-react";
import CdpCreateWalletButton from "@/components/cdp/CdpCreateWalletButton";

function truncate(addr: string) { return addr.slice(0, 4) + "..." + addr.slice(-4); }

interface WalletRow {
  address: string;
  walletType: string;
  isPrimary: boolean;
  repoCount: number;
}

export default function DashboardWallets() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState("");
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
  const [infoFor, setInfoFor] = useState<string | null>(null);

  const hasSmart = wallets.some(w => w.walletType === "smart");
  const refresh = () => {
    fetch("/api/wallet/link").then(r => r.json()).then(j => Array.isArray(j) ? setWallets(j) : setWallets([])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    refresh();
  }, [status]);

  const cdpConfigured = !!process.env.NEXT_PUBLIC_CDP_PROJECT_ID;

  async function linkWallet() {
    if (!address) { open(); return; }
    setLinking(true);
    setMessage("");
    try {
      const login = (session?.user as any)?.login || session?.user?.name || "user";
      const nonce = Math.random().toString(36).slice(2);
      const msg = `Link wallet ${address} to ${login} ${nonce}`;
      const sig = await signMessageAsync({ message: msg });
      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature: sig, nonce }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("Wallet linked!");
        refresh();
      } else {
        setMessage(data.error || "Failed to link");
      }
    } catch (e: any) {
      setMessage(e.message || "Failed to link");
    }
    setLinking(false);
  }

  async function unlinkWallet(walletAddress: string) {
    setConfirmFor(null);
    setUnlinking(walletAddress);
    try {
      const res = await fetch("/api/wallet/link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await res.json();
      if (data.ok) {
        setWallets((prev) => prev.filter((w) => w.address !== walletAddress.toLowerCase()));
      } else {
        setMessage(data.error || "Failed to unlink");
      }
    } catch (e: any) {
      setMessage(e.message || "Failed to unlink");
    }
    setUnlinking(null);
  }

  async function setPrimary(walletAddress: string) {
    try {
      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress, signature: "0x", nonce: "primary", walletType: wallets.find(w=>w.address===walletAddress)?.walletType || "eoa", isPrimary: true }),
      });
      const data = await res.json();
      if (data.ok) refresh();
      else setMessage(data.error || "Failed");
    } catch (e:any){ setMessage(e.message); }
  }

  if (status === "loading") return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="serif text-2xl font-semibold">Wallets</h1>

      {!hasSmart && !loading && (
        <div className="border rule rounded-sm p-4 bg-amber-50/50 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4" /> Create your Opentip Smart Wallet</p>
            <p className="text-xs text-zinc-600 mt-1">Real smart account — same address on any device via email. Becomes primary automatically.</p>
            {!cdpConfigured && <p className="text-xs text-red-600 mt-1">Missing NEXT_PUBLIC_CDP_PROJECT_ID — add it to .env and restart dev.</p>}
          </div>
          <CdpCreateWalletButton onCreated={refresh} />
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm text-zinc-600">Link wallets to register repos and receive tips. Payout wallets for your repos.</p>

        {isConnected && address && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="stats text-xs text-zinc-700 border rule rounded-sm px-2 py-1">{truncate(address)}</span>
            <Button size="sm" onClick={linkWallet} disabled={linking}>
              {linking ? "Linking..." : "Link current wallet"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => disconnect()} className="text-xs text-zinc-400 hover:text-zinc-600">
              Disconnect
            </Button>
          </div>
        )}

        {!isConnected && (
          <Button size="sm" variant="secondary" onClick={() => open()}>Connect wallet to link</Button>
        )}

        {message && <p className="text-xs text-zinc-600">{message}</p>}
      </div>

      <div className="border-t rule pt-4">
        <h2 className="serif text-sm font-semibold mb-3">Linked payout wallets</h2>
        {loading ? (
          <Loader variant="dots" size={16} />
        ) : wallets.length === 0 ? (
          <p className="text-xs text-zinc-500">No wallets linked yet.</p>
        ) : (
          <div className="space-y-1">
            {wallets.map((w) => (
              <div key={w.address} className="flex items-center justify-between border rule rounded-sm px-2 py-1.5 w-fit gap-4">
                <div className="flex items-center gap-2">
                  <span className="stats text-xs text-zinc-700">{truncate(w.address)}</span>
                  {w.walletType==="smart" && <span className="text-[0.6rem] bg-zinc-900 text-white px-1.5 py-0.5 rounded">SMART</span>}
                  {w.isPrimary && <span className="text-[0.6rem] border rule px-1.5 py-0.5 rounded">PRIMARY</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  {!w.isPrimary && <button onClick={() => setPrimary(w.address)} className="text-xs text-accent hover:underline">Set primary</button>}
                  {w.repoCount > 0 ? (
                    <div className="relative">
                      <button
                        onClick={() => setInfoFor(infoFor === w.address ? null : w.address)}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors"
                        aria-label="Why can't I unlink?"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                      {infoFor === w.address && (
                        <div className="absolute left-0 top-full mt-1 z-sticky w-56 bg-white border rule rounded-sm px-3 py-2 shadow-sm">
                          <p className="text-xs text-zinc-600">
                            This wallet is the payout address for {w.repoCount} repo{singular(w.repoCount)}. Unregister the repo{singular(w.repoCount)} first before unlinking.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : confirmFor === w.address ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-600">Unlink?</span>
                      <Button size="sm" variant="ghost" onClick={() => unlinkWallet(w.address)} disabled={unlinking === w.address} className="h-6 px-2 text-xs text-red-600 hover:text-red-700">
                        {unlinking === w.address ? "..." : "Yes"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmFor(null)} className="h-6 px-2 text-xs">
                        No
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmFor(w.address)}
                      disabled={unlinking === w.address}
                      className="text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      aria-label="Unlink wallet"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function singular(n: number) { return n === 1 ? "" : "s"; }
