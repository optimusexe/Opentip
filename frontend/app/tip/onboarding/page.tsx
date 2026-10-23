"use client";
import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/providers";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { Copy } from "lucide-react";
import { useAuthenticateWithJWT, useCurrentUser, useEvmAddress, useCreateEvmSmartAccount } from "@coinbase/cdp-hooks";
import { toTipPath } from "@/lib/tip-path";

type Step = "account" | "github" | "creating" | "created" | "welcome";

function truncate(a: string) { return a.slice(0, 6) + "..." + a.slice(-4); }

// Silent wallet creation — runs once on mount, no UI of its own.
function WalletCreator({ onDone, onError }: { onDone: (addr: string) => void; onError: (msg: string) => void }) {
  const { authenticateWithJWT } = useAuthenticateWithJWT();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();
  const smartHook: any = useCreateEvmSmartAccount();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const result: any = await authenticateWithJWT();
        let addr: string | null =
          result?.user?.evmSmartAccountObjects?.[0]?.address ||
          result?.user?.evmSmartAccounts?.[0] ||
          result?.user?.evmAccountObjects?.[0]?.address ||
          null;
        if (!addr) {
          const createFn = smartHook?.createSmartAccount || smartHook?.createEvmSmartAccount;
          if (typeof createFn === "function") {
            try {
              const created: any = await createFn({ enableSpendPermissions: true });
              addr = typeof created === "string" ? created : created?.address || created?.smartAccountAddress || null;
            } catch (e: any) {
              const cu: any = currentUser;
              addr = cu?.evmSmartAccountObjects?.[0]?.address || cu?.evmSmartAccounts?.[0] || null;
              if (!addr) throw e;
            }
          }
        }
        if (!addr && evmAddress) addr = evmAddress as string;
        if (!addr) throw new Error("CDP returned no address");
        const res = await fetch("/api/wallet/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr, signature: "0x", nonce: "cdp", walletType: "smart", isPrimary: true }),
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || "Failed to save wallet");
        onDone(addr);
      } catch (e: any) {
        onError(e.message || "Failed to create wallet");
      }
    })();
  }, []);

  return null;
}

const STAGES = ["Account", "GitHub", "Wallet", "Done"];

export default function OnboardingPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = toTipPath(searchParams.get("next") || "/tip/dashboard/github-repos", "/tip/dashboard/github-repos");
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("account");
  const [checking, setChecking] = useState(true);
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // Entry routing: complete users go straight to `next`; otherwise
  // account → github (email users) → creating/created → welcome
  useEffect(() => {
    if (status === "unauthenticated") { setStep("account"); setChecking(false); return; }
    if (status !== "authenticated") return;
    (async () => {
      try {
        const [st, wl] = await Promise.all([
          fetch("/api/account/status").then((r) => r.json()).catch(() => ({})),
          fetch("/api/wallet/link").then((r) => r.json()).catch(() => []),
        ]);
        if ((st as any)?.onboardingComplete) {
          setChecking(false);
          router.replace(next);
          return;
        }
        const wallets = Array.isArray(wl) ? wl : [];
        const smart = wallets.find((w: any) => w.walletType === "smart")?.address || null;
        if (!st?.hasGithub) {
          setStep("github");
        } else if (smart) {
          setWalletAddress(smart);
          setStep("created");
        } else {
          setStep("creating");
        }
      } catch {
        setStep("github");
      } finally {
        setChecking(false);
      }
    })();
  }, [status, router, next]);

  // Reaching the last step marks onboarding complete — fire once so users
  // who close the tab at welcome don't get bounced back here.
  const welcomedRef = useRef(false);
  useEffect(() => {
    if (step !== "welcome" || welcomedRef.current) return;
    welcomedRef.current = true;
    fetch("/api/account/onboarding-complete", { method: "POST" }).catch(() => {});
  }, [step]);

  const connectGithub = async () => {
    setConnectingGithub(true);
    try {
      const res = await fetch("/api/account/github/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next: `/tip/onboarding?next=${encodeURIComponent(next)}` }),
      });
      const j = await res.json();
      if (!res.ok || !j.url) throw new Error(j.error || "Failed to start GitHub connect");
      window.location.href = j.url;
    } catch (e: any) {
      showToast({ status: "error", title: "GitHub connect failed", description: e.message?.slice(0, 120) });
      setConnectingGithub(false);
    }
  };

  const copyAddress = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    showToast({ status: "success", title: "Copied" });
  };

  const stageIndex =
    step === "account" ? 1 : step === "github" ? 2 : step === "creating" || step === "created" ? 3 : 4;

  if (status === "loading" || checking) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader variant="spinner" size={24} /></div>;
  }

  return (
    <div className="max-w-sm mx-auto space-y-0">
      <section className="py-16 md:py-24 border-b border-border space-y-6">
        <h1 className="font-display text-3xl tracking-tight">Set up Opentip</h1>
        <div className="flex gap-1.5">
          {STAGES.map((label, i) => {
            const n = i + 1;
            return (
              <div key={label} className="flex-1 flex flex-col gap-2">
                <div className={`h-1 rounded-sm ${stageIndex >= n ? "bg-foreground" : "bg-border"}`} />
                <span className={`text-[0.6rem] uppercase tracking-[0.15em] ${stageIndex >= n ? "text-foreground/80" : "text-muted-foreground"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {step === "account" && (
        <section className="py-10 border-b border-border space-y-4">
          <h2 className="font-display text-lg">Create your account</h2>
          <p className="text-sm text-muted-foreground">Sign in with GitHub or email. Tippers don&apos;t need an account — just connect a wallet on any tip page.</p>
          <div className="flex gap-3">
            <Button onClick={() => signIn("github", { callbackUrl: "/tip/onboarding" })}>Sign in with GitHub</Button>
            <Button variant="ghost" onClick={() => router.push("/tip/signin")}>Use email</Button>
          </div>
        </section>
      )}

      {step === "github" && (
        <section className="py-10 border-b border-border space-y-4">
          <h2 className="font-display text-lg">Connect GitHub</h2>
          <p className="text-sm text-muted-foreground">Link your GitHub so you can verify repo ownership and register repos for tips.</p>
          <div>
            <Button onClick={connectGithub} disabled={connectingGithub}>
              {connectingGithub ? "Redirecting…" : "Connect GitHub"}
            </Button>
          </div>
        </section>
      )}

      {step === "creating" && (
        <section className="py-10 border-b border-border space-y-4">
          <WalletCreator
            key={retryNonce}
            onDone={(addr) => { setWalletAddress(addr); setCreateError(null); setStep("created"); }}
            onError={(msg) => setCreateError(msg)}
          />
          {createError ? (
            <>
              <h2 className="font-display text-lg">Wallet creation failed</h2>
              <p className="text-sm text-muted-foreground">{createError.slice(0, 200)}</p>
              <div>
                <Button onClick={() => { setCreateError(null); setRetryNonce((n) => n + 1); }}>Try again</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center py-4"><Loader variant="spinner" size={28} /></div>
              <h2 className="font-display text-lg text-center">Creating your wallet, please wait…</h2>
              <p className="text-sm text-muted-foreground text-center">Your Opentip Smart Wallet works on every device. This takes a few seconds.</p>
            </>
          )}
        </section>
      )}

      {step === "created" && walletAddress && (
        <section className="py-10 border-b border-border space-y-4">
          <h2 className="font-display text-lg">Wallet created</h2>
          <div className="flex items-center gap-2">
            <span className="stats text-sm text-foreground rounded-[10px] border border-border px-2 py-1">{truncate(walletAddress)}</span>
            <span className="text-[0.6rem] bg-foreground text-background px-1.5 py-0.5 rounded">SMART</span>
            <button onClick={copyAddress} className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy address">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">Send ETH, USDC, or OAR to your wallet on <strong>Base</strong>.</p>
          <div>
            <Button onClick={() => setStep("welcome")}>Next</Button>
          </div>
        </section>
      )}

      {step === "welcome" && (
        <section className="py-10 border-b border-border space-y-4">
          <h2 className="font-display text-lg">Welcome to Opentip</h2>
          <p className="text-sm text-muted-foreground">You are all set — account linked, wallet ready.</p>
          <div>
            <Button onClick={() => router.push(next)}>{next === "/tip/dashboard/github-repos" ? "Register repo now" : "Continue"}</Button>
          </div>
        </section>
      )}
    </div>
  );
}
