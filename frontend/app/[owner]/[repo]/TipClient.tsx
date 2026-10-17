"use client";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignMessage, useSendTransaction, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { signIn, useSession } from "next-auth/react";
import { parseUnits, formatUnits, parseEther, encodeFunctionData } from "viem";
import { opentipV2Abi, erc20Abi } from "@/lib/contract";
import { CHAIN_ID, CONTRACT_ADDRESS, USDC_ADDRESS, OAR_ADDRESS, ETH_ADDRESS, VIEM_CHAIN, getTokenDecimals, capitalize } from "@/lib/chain";
import { mayAnnounceTipSent } from "@/lib/wallet-chain";
import { DATA_SUFFIX } from "@/lib/builderCode";
import { useOpentipSend, type OpentipCall } from "@/lib/cdpSend";
import { logWalletTx, confirmWalletTx } from "@/lib/walletTx";
import { estimateGasUsd } from "@/lib/gasEstimate";
import TxReviewModal from "@/components/TxReviewModal";
import { ethTipAmountError, fmtUsd } from "@/lib/prices";
import { walletWriteToast, type WalletWriteKind } from "@/lib/wallet-write";
import { isPositiveBigint } from "@/lib/positive-bigint";
import { displayNameMessage } from "@/lib/display-name";
import { markInstallTipped } from "@/components/installPrompt";
import { useToast } from "@/app/providers";
import { Input } from "@/components/motion/input";
import { Button, StatefulButton } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { SplitBar } from "@/components/ledger/SplitBar";
import { Segmented } from "@/components/ledger/Segmented";
import { bpsLabel } from "@/lib/fee-bps";
import { claimButtonLabel, copyTipLinkLabel, displayNameSaveLabel, gasNote, tipSentToast } from "@/lib/ui-labels";
import { Copy } from "lucide-react";
import Image from "next/image";
import type { RepoSummary } from "@/lib/ai";
import { getBasescanTxUrl } from "@/lib/basescan";

function truncate(addr: string){ return addr.slice(0,6)+"..."+addr.slice(-4); }

type TokenInfo = { symbol: string; decimals: number; name: string; address: `0x${string}` };
const TOKENS: TokenInfo[] = [
  { symbol: "USDC", decimals: 6, name: "USD Coin", address: USDC_ADDRESS },
  { symbol: "ETH", decimals: 18, name: "Ethereum", address: ETH_ADDRESS },
  { symbol: "OAR", decimals: 18, name: "Oarcoin", address: OAR_ADDRESS },
];

const PRESETS: Record<string, string[]> = {
  [USDC_ADDRESS]: ["5", "10", "25", "100"],
  [ETH_ADDRESS]: ["0.005", "0.01", "0.05", "0.1"],
};

function previewSplit(amount: string, decimals: number, feeBps: number) {
  try {
    const gross = parseUnits(amount, decimals);
    if (gross <= 0n) return null;
    const fee = (gross * BigInt(feeBps)) / 10000n;
    return { fee, maintainer: gross - fee };
  } catch {
    return null;
  }
}

function formatAmount(raw: bigint, token: TokenInfo): string {
  const formatted = formatUnits(raw, token.decimals);
  const n = parseFloat(formatted);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

type RepoLink = { title: string; url: string };
type RepoDeveloper = { login: string; pfp: string | null; image: string | null };

export default function TipClient({
  repoId,
  project,
  description = null,
  icon = null,
  summary = null,
  links = [],
  developer = null,
  funderCount = null,
}: {
  repoId: string;
  project?: string;
  description?: string | null;
  icon?: string | null;
  summary?: RepoSummary | null;
  links?: RepoLink[];
  developer?: RepoDeveloper | null;
  funderCount?: number | null;
}) {
  const router = useRouter();
  const repoIdLower = repoId.toLowerCase();
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { open } = useAppKit();
  const { data: session } = useSession();
  const { showToast, dismissToast } = useToast();
  const { signMessageAsync } = useSignMessage();
  const { send: cdpSend, signMessage: cdpSignMessage, txData: cdpTxData } = useOpentipSend();
  const [pendingUserOp, setPendingUserOp] = useState<string | null>(null);
  const patchedOps = useRef<Set<string>>(new Set());
  const receiptKinds = useRef<Map<string, "fund" | "claim">>(new Map());
  const wentToReceipt = useRef(false);

  function openReceipt(hash: string | undefined) {
    if (!hash || wentToReceipt.current) return;
    wentToReceipt.current = true;
    router.push(`/receipt/${hash}`);
  }

  // Confirm write-ahead log rows once the chain hash is known.
  // Stay mounted until that hash exists; the receipt URL is the chain tx.
  useEffect(() => {
    const txHash = (cdpTxData as any)?.transactionHash as string | undefined;
    if (txHash && pendingUserOp && !patchedOps.current.has(pendingUserOp)) {
      patchedOps.current.add(pendingUserOp);
      confirmWalletTx(pendingUserOp, txHash);
      if (receiptKinds.current.get(pendingUserOp)) openReceipt(txHash);
    }
  }, [cdpTxData, pendingUserOp]);
  const contract = CONTRACT_ADDRESS;
  const cdpConfigured = !!process.env.NEXT_PUBLIC_CDP_PROJECT_ID;

  const { data: isRegistered, isPending: isRegPending } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "isRegistered", args: [repoIdLower], chainId: CHAIN_ID, query: { enabled: !!contract } });
  const { data: payout } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getPayoutAddress", args: [repoIdLower], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });
  // Per-token pending balances
  const { data: pendingUSDC } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getPendingBalance", args: [repoIdLower, USDC_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });
  const { data: pendingETH } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getPendingBalance", args: [repoIdLower, ETH_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });
  const { data: pendingOAR } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getPendingBalance", args: [repoIdLower, OAR_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });

  // Per-token total tipped
  const { data: totalUSDC } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getTotalTipped", args: [repoIdLower, USDC_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract } });
  const { data: totalETH } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getTotalTipped", args: [repoIdLower, ETH_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract } });
  const { data: totalOAR } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getTotalTipped", args: [repoIdLower, OAR_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract } });
  const { data: feeBpsRaw } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "feeBps", chainId: CHAIN_ID, query: { enabled: !!contract } });

  const [amount, setAmount] = useState("5");
  const [selectedToken, setSelectedToken] = useState<string>(USDC_ADDRESS);
  const [displayName, setDisplayName] = useState("");
  const [tips, setTips] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [tipsLoading, setTipsLoading] = useState(true);
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  const [tipFlow, setTipFlow] = useState<"idle"|"approving"|"sending"|"success"|"error">("idle");
  const [showTipReview, setShowTipReview] = useState(false);
  const [reviewSponsored, setReviewSponsored] = useState<boolean | null>(null);
  const [gasEstimating, setGasEstimating] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [claimState, setClaimState] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [registerState, setRegisterState] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [detailTab, setDetailTab] = useState<"about" | "supporters">("about");
  const [ownership, setOwnership] = useState<{ owns?: boolean; via?: string; loading?: boolean; signature?: string; expiry?: string; nonce?: string }>({});
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<string>("");
  const loadingToastRef = useRef<string | null>(null);

  const currentToken = TOKENS.find(t => t.address === selectedToken) || TOKENS[0];
  const isETH = selectedToken === ETH_ADDRESS;

  // Allowance for ERC-20 tokens
  const { data: allowance } = useReadContract({
    address: selectedToken as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && contract ? [address, contract] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!address && !!contract && !!isRegistered && !isETH } as any,
  });

  // Opentip Smart Wallet (CDP) — preferred signer when available
  const smartAddr =
    (wallets as any[]).find((w) => w.isPrimary && w.walletType === "smart")?.address ||
    (wallets as any[]).find((w) => w.walletType === "smart")?.address ||
    null;
  const useSmart = !!session && !!smartAddr && cdpConfigured;

  // Gas info for the tip review modal. Smart path resolves sponsorship;
  // EOA tips are always user-paid.
  useEffect(() => {
    if (!showTipReview) return;
    let cancelled = false;
    setReviewSponsored(null);
    setGasEstimate(null);
    setGasEstimating(true);
    (async () => {
      let sponsored: boolean | null = null;
      if (useSmart) {
        try {
          const r = await fetch("/api/paymaster/status");
          const j = await r.json();
          if (typeof j?.sponsored === "boolean") sponsored = j.sponsored;
        } catch {}
      } else {
        sponsored = false;
      }
      if (cancelled) return;
      setReviewSponsored(sponsored);
      if (sponsored === false) {
        const est = await estimateGasUsd("tip", prices[ETH_ADDRESS.toLowerCase()] || 0);
        if (!cancelled) setGasEstimate(est);
      }
      if (!cancelled) setGasEstimating(false);
    })();
    return () => { cancelled = true; };
  }, [showTipReview, useSmart]);

  // Allowance for the smart wallet (batched approve+tip needs it only when insufficient)
  const { data: smartAllowance } = useReadContract({
    address: selectedToken as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: smartAddr && contract ? [smartAddr as `0x${string}`, contract] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: useSmart && !!contract && !!isRegistered && !isETH } as any,
  });

  useEffect(() => {
    // Smart wallet path needs no wagmi connection — don't reset its flow
    if (!isConnected && !useSmart && tipFlow !== "idle") {
      setTipFlow("idle");
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
    }
  }, [isConnected, useSmart]);

  const showLoading = (title: string, desc?: string) => {
    if (loadingToastRef.current) dismissToast(loadingToastRef.current);
    const id = showToast({ status: "loading", title, description: desc, duration: 0 });
    loadingToastRef.current = id;
    return id;
  };

  // External-wallet prompts that the user cancels never produce a receipt.
  // Reset the button and surface the wallet's message instead of staying on
  // "Approving spend..." / "Sending...".
  const failWrite = (kind: WalletWriteKind, error: any) => {
    if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
    const toast = walletWriteToast(kind, error ?? {});
    showToast({ status: "error", title: toast.title, description: toast.description });
    if (kind === "claim") {
      setClaimState("error");
      setTimeout(() => setClaimState("idle"), 2000);
      return;
    }
    if (kind === "register") {
      setRegisterState("error");
      setTimeout(() => setRegisterState("idle"), 2000);
      return;
    }
    setTipFlow("error");
    setTimeout(() => setTipFlow("idle"), 2000);
  };

  useEffect(() => {
    if (session) {
      fetch("/api/wallet/link").then(r => r.json()).then(j => {
        if (Array.isArray(j)) {
          setWallets(j);
          // Default payout to Opentip Smart Wallet (primary or smart type) — per plan
          const primary = (j as any[]).find(w => w.isPrimary) || (j as any[]).find(w => w.walletType === "smart") || j[0];
          if (primary?.address) setSelectedPayout(primary.address);
        }
      }).catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (!selectedPayout && address) setSelectedPayout(address);
  }, [address, selectedPayout]);

  useEffect(()=>{ setTipsLoading(true); Promise.all([
    fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{}),
    fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{}),
    fetch(`/api/prices`).then(r=>r.json()).then(setPrices).catch(()=>{})
  ]).finally(()=>setTipsLoading(false)); }, [repoIdLower]);

  const approveW = useWriteContract();
  const tipW = useWriteContract();
  const claimW = useWriteContract();
  const registerW = useWriteContract();
  const ethSend = useSendTransaction();

  const approveReceipt = useWaitForTransactionReceipt({ hash: approveW.data, chainId: CHAIN_ID });
  const tipReceipt = useWaitForTransactionReceipt({ hash: tipW.data, chainId: CHAIN_ID });
  const claimReceipt = useWaitForTransactionReceipt({ hash: claimW.data, chainId: CHAIN_ID });
  const registerReceipt = useWaitForTransactionReceipt({ hash: registerW.data, chainId: CHAIN_ID });
  const ethReceipt = useWaitForTransactionReceipt({ hash: ethSend.data, chainId: CHAIN_ID });

  const ensureConfiguredChain = async (): Promise<boolean> => {
    if (chainId === CHAIN_ID) return true;
    try {
      await switchChainAsync({ chainId: CHAIN_ID });
      return true;
    } catch {
      showToast({
        status: "error",
        title: "Wrong network",
        description: `Switch your wallet to ${VIEM_CHAIN.name} before sending.`,
      });
      return false;
    }
  };

  const validateAmount = (v: string, token: TokenInfo, priceMap: Record<string, number> = {}) => {
    const n = Number(v);
    if (!v || isNaN(n) || n <= 0) return "Enter an amount";
    try {
      parseUnits(v, token.decimals);
    } catch { return "Invalid amount"; }
    if (token.address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
      return ethTipAmountError(n, priceMap[token.address.toLowerCase()]);
    }
    const price = priceMap[token.address.toLowerCase()] ?? 0;
    if (price > 0 && n * price < 1) return "Minimum is $1";
    return undefined;
  };

  // ERC-20 approve receipt
  useEffect(()=>{
    if (tipFlow==="approving" && approveReceipt.isSuccess && approveW.data) {
      const baseUnits = parseUnits(amount, currentToken.decimals);
      setTipFlow("sending");
      showLoading("Sending...", `${amount} ${currentToken.symbol} → ${repoIdLower}`);
      void tipW.writeContractAsync({ address: contract!, abi: opentipV2Abi, functionName: "receiveTip", args: [repoIdLower, selectedToken as `0x${string}`, baseUnits], chainId: CHAIN_ID }).catch((e) => failWrite("tip", e));
    }
    if (tipFlow==="approving" && approveReceipt.isError) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"error", title:"Approve failed", description: (approveReceipt.error as any)?.message?.slice(0,100) });
      setTipFlow("error"); setTimeout(()=>setTipFlow("idle"), 2000);
    }
  }, [approveReceipt.isSuccess, approveReceipt.isError]);

  // ERC-20 tip receipt
  useEffect(()=>{
    if (tipFlow==="sending" && tipReceipt.isSuccess) {
      if (!mayAnnounceTipSent(chainId, CHAIN_ID)) {
        if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
        showToast({ status:"error", title:"Wrong network", description:`That transaction was not confirmed on ${VIEM_CHAIN.name}.` });
        setTipFlow("error"); setTimeout(()=>setTipFlow("idle"), 2000);
        return;
      }
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      if (tipW.data && address) {
        try {
          logWalletTx({ walletAddress: address, kind: "tip", repoId: repoIdLower, token: selectedToken, amount: parseUnits(amount, currentToken.decimals).toString(), toAddress: contract!, txHash: tipW.data });
        } catch {}
      }
      showToast({ status:"success", title: tipSentToast, description:`${amount} ${currentToken.symbol} → ${repoIdLower}` });
      markInstallTipped();
      setTipFlow("success");
      fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{});
      fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{});
      if (tipW.data) openReceipt(tipW.data);
      else setTimeout(()=>setTipFlow("idle"), 1600);
    }
    if (tipFlow==="sending" && tipReceipt.isError) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"error", title:"Tip failed", description: (tipReceipt.error as any)?.message?.slice(0,120) });
      setTipFlow("error"); setTimeout(()=>setTipFlow("idle"), 2000);
    }
  }, [tipReceipt.isSuccess, tipReceipt.isError]);

  // ETH send receipt
  useEffect(()=>{
    if (tipFlow==="sending" && ethReceipt.isSuccess) {
      if (!mayAnnounceTipSent(chainId, CHAIN_ID)) {
        if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
        showToast({ status:"error", title:"Wrong network", description:`That transaction was not confirmed on ${VIEM_CHAIN.name}.` });
        setTipFlow("error"); setTimeout(()=>setTipFlow("idle"), 2000);
        return;
      }
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      if (ethSend.data && address) {
        try {
          logWalletTx({ walletAddress: address, kind: "tip", repoId: repoIdLower, token: ETH_ADDRESS, amount: parseEther(amount).toString(), toAddress: contract!, txHash: ethSend.data });
        } catch {}
      }
      showToast({ status:"success", title: tipSentToast, description:`${amount} ETH → ${repoIdLower}` });
      markInstallTipped();
      setTipFlow("success");
      fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{});
      fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{});
      if (ethSend.data) openReceipt(ethSend.data);
      else setTimeout(()=>setTipFlow("idle"), 1600);
    }
    if (tipFlow==="sending" && ethReceipt.isError) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"error", title:"Tip failed", description: (ethReceipt.error as any)?.message?.slice(0,120) });
      setTipFlow("error"); setTimeout(()=>setTipFlow("idle"), 2000);
    }
  }, [ethReceipt.isSuccess, ethReceipt.isError]);

  useEffect(()=>{
    if (ethSend.error) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"error", title:"Transaction rejected", description: ethSend.error.message?.slice(0,100) });
      setTipFlow("error"); setTimeout(()=>setTipFlow("idle"),2000);
    }
  }, [ethSend.error]);

  // Claim all receipt
  useEffect(()=>{
    if (claimState==="loading" && claimReceipt.isSuccess) {
      if (claimW.data && address) {
        logWalletTx({ walletAddress: address, kind: "claim", repoId: repoIdLower, txHash: claimW.data });
      }
      setClaimState("success");
      showToast({ status:"success", title:"Claimed all tokens" });
      if (claimW.data) openReceipt(claimW.data);
      else setTimeout(()=>setClaimState("idle"),1600);
    }
    if (claimState==="loading" && claimReceipt.isError) {
      setClaimState("error");
      showToast({ status:"error", title:"Claim failed" });
      setTimeout(()=>setClaimState("idle"),2000);
    }
  }, [claimReceipt.isSuccess, claimReceipt.isError]);

  // Register receipt
  useEffect(()=>{
    if (registerState==="loading" && registerReceipt.isSuccess) {
      if (registerW.data && address) {
        logWalletTx({ walletAddress: address, kind: "register", repoId: repoIdLower, txHash: registerW.data });
      }
      setRegisterState("success"); showToast({ status:"success", title:"Registered", description: repoIdLower }); setTimeout(()=>setRegisterState("idle"),1600);
    }
    if (registerState==="loading" && registerReceipt.isError) { setRegisterState("error"); showToast({ status:"error", title:"Register failed" }); setTimeout(()=>setRegisterState("idle"),2000); }
  }, [registerReceipt.isSuccess, registerReceipt.isError]);

  const openTipReview = () => {
    const err = validateAmount(amount, currentToken, prices);
    setAmountError(err);
    if (err) { showToast({ status:"error", title: err }); return; }
    if (!contract) { showToast({ status:"error", title:"Contract not configured" }); return; }
    setShowTipReview(true);
  };

  const onTipClick = async () => {
    const err = validateAmount(amount, currentToken, prices);
    setAmountError(err);
    if (err) { showToast({ status:"error", title: err }); return; }
    if (!contract) { showToast({ status:"error", title:"Contract not configured" }); return; }

    // Smart wallet path — one userOp (approve+tip batched for ERC-20)
    if (useSmart && smartAddr) {
      setTipFlow("sending");
      showLoading("Sending...", `${amount} ${currentToken.symbol} → ${repoIdLower}`);
      try {
        const baseUnits = parseUnits(amount, currentToken.decimals);
        let calls: OpentipCall[];
        if (isETH) {
          const data = encodeFunctionData({ abi: opentipV2Abi, functionName: "receiveTipEth", args: [repoIdLower] });
          calls = [{ to: contract, value: parseEther(amount), data }];
        } else {
          const allowed = (smartAllowance as bigint) || BigInt(0);
          const tipData = encodeFunctionData({ abi: opentipV2Abi, functionName: "receiveTip", args: [repoIdLower, selectedToken as `0x${string}`, baseUnits] });
          calls = allowed >= baseUnits
            ? [{ to: contract, data: tipData }]
            : [
                { to: selectedToken as `0x${string}`, data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [contract, baseUnits] }) },
                { to: contract, data: tipData },
              ];
        }
        const { userOperationHash, sponsored, selfPaidBecause } = await cdpSend(calls);
        if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
        if (userOperationHash && smartAddr) {
          receiptKinds.current.set(userOperationHash, "fund");
          setPendingUserOp(userOperationHash);
          logWalletTx({ walletAddress: smartAddr, kind: "tip", repoId: repoIdLower, token: selectedToken, amount: baseUnits.toString(), toAddress: contract, userOpHash: userOperationHash });
        }
        const gasSuffix = sponsored === false
          ? selfPaidBecause === "paymaster"
            ? ` ${gasNote.paymaster}`
            : ` ${gasNote.cap}`
          : "";
        showToast({ status:"success", title: tipSentToast, description:`${amount} ${currentToken.symbol} → ${repoIdLower}${gasSuffix}${userOperationHash ? ` (${userOperationHash.slice(0,10)}…)` : ""}` });
        markInstallTipped();
        setTipFlow("success"); setTimeout(()=>setTipFlow("idle"), 1600);
        fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{});
        fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{});
      } catch (e:any) {
        if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
        showToast({ status:"error", title:"Tip failed", description: e.message?.slice(0,120) });
        setTipFlow("error"); setTimeout(()=>setTipFlow("idle"), 2000);
      }
      return;
    }

    if (!isConnected || !address) { showToast({ status:"error", title:"Connect wallet" }); return; }
    if (!(await ensureConfiguredChain())) return;

    if (isETH) {
      setTipFlow("sending");
      showLoading("Sending...", `${amount} ETH → ${repoIdLower}`);
      const wei = parseEther(amount);
      const baseData = encodeFunctionData({ abi: opentipV2Abi, functionName: "receiveTipEth", args: [repoIdLower] });
      ethSend.sendTransaction({
        to: contract,
        value: wei,
        data: (baseData + DATA_SUFFIX.slice(2)) as `0x${string}`,
        chainId: CHAIN_ID,
      });
      return;
    }

    // ERC-20 flow
    const baseUnits = parseUnits(amount, currentToken.decimals);
    const currentAllowance = (allowance as bigint) || BigInt(0);
    if (currentAllowance < baseUnits) {
      setTipFlow("approving");
      showLoading("Approving spend...", `${amount} ${currentToken.symbol}`);
      try {
        await approveW.writeContractAsync({ address: selectedToken as `0x${string}`, abi: erc20Abi, functionName: "approve", args: [contract!, baseUnits], chainId: CHAIN_ID });
      } catch (e) {
        failWrite("approve", e);
      }
    } else {
      setTipFlow("sending");
      showLoading("Sending...", `${amount} ${currentToken.symbol} → ${repoIdLower}`);
      try {
        await tipW.writeContractAsync({ address: contract!, abi: opentipV2Abi, functionName: "receiveTip", args: [repoIdLower, selectedToken as `0x${string}`, baseUnits], chainId: CHAIN_ID });
      } catch (e) {
        failWrite("tip", e);
      }
    }
  };

  const onClaimAll = async () => {
    if (!contract) return;
    if (useSmart && smartAddr && payout && (payout as string).toLowerCase() === smartAddr.toLowerCase()) {
      setClaimState("loading");
      try {
        const data = encodeFunctionData({ abi: opentipV2Abi, functionName: "claimAll", args: [repoIdLower] });
        const { userOperationHash } = await cdpSend([{ to: contract, data }]);
        if (userOperationHash && smartAddr) {
          receiptKinds.current.set(userOperationHash, "claim");
          setPendingUserOp(userOperationHash);
          logWalletTx({ walletAddress: smartAddr, kind: "claim", repoId: repoIdLower, toAddress: contract, userOpHash: userOperationHash });
        }
        setClaimState("success");
        showToast({ status:"success", title:"Claimed all tokens" });
        setTimeout(()=>setClaimState("idle"),1600);
      } catch (e:any) {
        setClaimState("error");
        showToast({ status:"error", title:"Claim failed", description: e.message?.slice(0,120) });
        setTimeout(()=>setClaimState("idle"),2000);
      }
      return;
    }
    if (!(await ensureConfiguredChain())) return;
    setClaimState("loading");
    try {
      await claimW.writeContractAsync({ address: contract, abi: opentipV2Abi, functionName: "claimAll", args: [repoIdLower], chainId: CHAIN_ID });
    } catch (e) {
      failWrite("claim", e);
    }
  };

  const onRegister = async () => {
    const payout = selectedPayout || (useSmart ? smartAddr : address);
    if (!contract || !payout) return;
    if (ownership.signature && ownership.expiry && ownership.nonce) {
      setRegisterState("loading");
      if (useSmart && smartAddr) {
        try {
          const data = encodeFunctionData({ abi: opentipV2Abi, functionName: "registerRepo", args: [repoIdLower, payout as `0x${string}`, BigInt(ownership.expiry), BigInt(ownership.nonce), ownership.signature as `0x${string}`] });
          const { userOperationHash } = await cdpSend([{ to: contract, data }]);
          if (userOperationHash) {
            setPendingUserOp(userOperationHash);
            logWalletTx({ walletAddress: smartAddr, kind: "register", repoId: repoIdLower, toAddress: contract, userOpHash: userOperationHash });
          }
          setRegisterState("success"); showToast({ status:"success", title:"Registered", description: repoIdLower }); setTimeout(()=>setRegisterState("idle"),1600);
        } catch (e:any) {
          setRegisterState("error"); showToast({ status:"error", title:"Register failed", description: e.message?.slice(0,120) }); setTimeout(()=>setRegisterState("idle"),2000);
        }
        return;
      }
      if (!(await ensureConfiguredChain())) { setRegisterState("idle"); return; }
      try {
        await registerW.writeContractAsync({
          address: contract,
          abi: opentipV2Abi,
          functionName: "registerRepo",
          args: [repoIdLower, payout as `0x${string}`, BigInt(ownership.expiry), BigInt(ownership.nonce), ownership.signature as `0x${string}`],
          chainId: CHAIN_ID,
        });
      } catch (e) {
        failWrite("register", e);
      }
      return;
    }
    await checkOwnershipAndSign();
  };

  const checkOwnershipAndSign = async () => {
    const payout = selectedPayout || (useSmart ? smartAddr : address);
    if (!payout) { showToast({ status: "error", title: "Connect wallet first" }); return; }
    setOwnership({ loading: true });
    try {
      const res = await fetch("/api/verify-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: repoIdLower, payoutAddress: payout }),
      });
      const j = await res.json();
      if (j.ok) {
        setOwnership({ owns: true, via: "github", loading: false, signature: j.signature, expiry: j.expiry, nonce: j.nonce });
      } else {
        setOwnership({ owns: false, loading: false });
        if (j.error) showToast({ status: "error", title: "Can't register", description: String(j.error).slice(0, 180) });
      }
    } catch {
      setOwnership({ owns: false, loading: false });
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/${repoIdLower}`;
    await navigator.clipboard.writeText(url);
    showToast({ status:"success", title:"Copied", description: url });
  };

  const saveDisplayName = async () => {
    const nameAddress = (useSmart && smartAddr) ? smartAddr : address;
    if (!nameAddress || !displayName.trim()) { showToast({ status:"error", title:"Enter a display name" }); return; }
    const message = displayNameMessage(displayName.trim(), nameAddress);
    try {
      const signature = useSmart && smartAddr
        ? await cdpSignMessage(message)
        : await signMessageAsync({ message });
      const res = await fetch("/api/display-name", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ address: nameAddress, displayName: displayName.trim(), signature })});
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "invalid signature");
      }
      showToast({ status:"success", title:"Display name saved", description: displayName.trim() });
    } catch(e:any){ showToast({ status:"error", title:"Save failed", description: e.message?.slice(0,100) }); }
  };

  const tipButtonText = tipFlow==="approving" ? "Approving spend..." : tipFlow==="sending" ? "Sending..." : tipFlow==="success" ? tipSentToast : tipFlow==="error" ? "Try again" : `Tip ${amount} ${currentToken.symbol}`;
  const feeBps = feeBpsRaw == null ? null : Number(feeBpsRaw);
  const knownFee = feeBps != null && Number.isFinite(feeBps) && feeBps >= 0 && feeBps <= 10000;
  const split = knownFee ? previewSplit(amount, currentToken.decimals, feeBps) : null;
  const maintainerBps = knownFee ? 10000 - feeBps : 0;

  const pendingBalances = [
    { token: TOKENS[0], raw: pendingUSDC as bigint | undefined },
    { token: TOKENS[1], raw: pendingETH as bigint | undefined },
    { token: TOKENS[2], raw: pendingOAR as bigint | undefined },
  ].filter((b): b is { token: TokenInfo; raw: bigint } => isPositiveBigint(b.raw));

  const hasPendingClaim = pendingBalances.length > 0;

  if (contract === undefined) return <div className="py-12 text-sm text-muted-foreground">Contract address not configured.</div>;

  const usdHint = (Number(amount) || 0) * (prices[selectedToken.toLowerCase()] || 0);
  const projectName = project || capitalize(repoIdLower.split("/")[1]);
  const pricesReady = Object.keys(prices).length > 0;
  const fundedRows = [
    { token: TOKENS[0], raw: totalUSDC as bigint | undefined },
    { token: TOKENS[1], raw: totalETH as bigint | undefined },
    { token: TOKENS[2], raw: totalOAR as bigint | undefined },
  ].filter((b): b is { token: TokenInfo; raw: bigint } => isPositiveBigint(b.raw));
  const usdOf = (raw: bigint, token: TokenInfo) => {
    const price = prices[token.address.toLowerCase()] || 0;
    if (!(price > 0)) return null;
    return Number(formatUnits(raw, token.decimals)) * price;
  };
  const fundedAsUsd = pricesReady && fundedRows.every((row) => usdOf(row.raw, row.token) != null);
  const fundedUsd = fundedAsUsd ? fundedRows.reduce((sum, row) => sum + (usdOf(row.raw, row.token) ?? 0), 0) : null;
  const pendingAsUsd = pricesReady && pendingBalances.every((row) => usdOf(row.raw, row.token) != null);
  const pendingUsd = pendingAsUsd ? pendingBalances.reduce((sum, row) => sum + (usdOf(row.raw, row.token) ?? 0), 0) : null;
  const isPayoutWallet = Boolean(
    (address && payout && (address.toLowerCase() === (payout as string).toLowerCase())) ||
    (useSmart && smartAddr && payout && (payout as string).toLowerCase() === smartAddr.toLowerCase()),
  );
  const supporters = (() => {
    const merged = new Map<string, { display_name: string|null; tipper_address: string; usd: number }>();
    for (const r of leaderboard as any[]) {
      const key = r.tipper_address.toLowerCase();
      if (!merged.has(key)) merged.set(key, { display_name: r.display_name, tipper_address: r.tipper_address, usd: 0 });
      const entry = merged.get(key)!;
      const decimals = r.decimals ?? getTokenDecimals(r.token);
      const amountN = Number(r.total) / Math.pow(10, decimals);
      const price = prices[r.token?.toLowerCase()] ?? 0;
      entry.usd += amountN * price;
    }
    return [...merged.values()].sort((a, b) => b.usd - a.usd).slice(0, 10);
  })();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <Image src={icon} alt="" width={48} height={48} className="size-12 rounded-[10px] border border-border object-cover" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-[10px] border border-border bg-card font-display text-xl">
              {projectName.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="font-display text-3xl sm:text-4xl">{projectName}</h1>
              {developer ? (
                <a href={`/dev/${developer.login}`} className="inline-flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">by <span className="font-medium text-foreground">{developer.login}</span></span>
                  <img
                    src={developer.pfp || developer.image || `https://avatars.githubusercontent.com/${developer.login}`}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 rounded-full"
                  />
                </a>
              ) : null}
            </div>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        <Button variant="outline" onClick={copyLink}>
          <Copy className="h-3.5 w-3.5" /> {copyTipLinkLabel}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total tipped">
          {fundedAsUsd && fundedUsd != null ? (
            <p className="mt-1 text-2xl tabular-nums">{fmtUsd(fundedUsd)}</p>
          ) : fundedRows.length === 0 ? (
            <p className="mt-1 text-2xl text-muted-foreground">—</p>
          ) : (
            <div className="mt-1 flex flex-col gap-1">
              {fundedRows.map((row) => (
                <p key={row.token.symbol} className="font-mono text-lg tabular-nums">
                  {formatAmount(row.raw, row.token)} <span className="font-sans text-xs text-muted-foreground">{row.token.symbol}</span>
                </p>
              ))}
            </div>
          )}
        </StatCard>
        <StatCard label="Supporters">
          <p className="mt-1 text-2xl tabular-nums">{funderCount == null ? "—" : funderCount.toLocaleString("en-US")}</p>
        </StatCard>
        <StatCard label="Pending claim" pending>
          {!isRegistered ? (
            <p className="mt-1 text-2xl text-pending tabular-nums">—</p>
          ) : pendingAsUsd && pendingUsd != null ? (
            <p className="mt-1 text-2xl text-pending tabular-nums">{fmtUsd(pendingUsd)}</p>
          ) : pendingBalances.length === 0 ? (
            <p className="mt-1 text-2xl text-pending tabular-nums">{pricesReady ? fmtUsd(0) : "—"}</p>
          ) : (
            <div className="mt-1 flex flex-col gap-1">
              {pendingBalances.map((row) => (
                <p key={row.token.symbol} className="font-mono text-lg text-pending tabular-nums">
                  {formatAmount(row.raw, row.token)} <span className="font-sans text-xs text-muted-foreground">{row.token.symbol}</span>
                </p>
              ))}
            </div>
          )}
        </StatCard>
      </div>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
          <section className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium">Ledger</h2>
              <p className="text-xs text-muted-foreground">Recent tips · {VIEM_CHAIN.name}</p>
            </div>
            {tipsLoading ? (
              <div className="flex justify-center py-8"><Loader variant="dots" size={20} /></div>
            ) : tips.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-border px-4 py-10 text-center">
                <p className="font-medium">No tips yet</p>
                <p className="mt-1 text-sm text-muted-foreground">The first contribution will show up here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[10px] border border-border">
                <table className="w-full min-w-[280px] text-left">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Supporter</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                      <th className="hidden px-3 py-2 font-medium sm:table-cell">To maintainers</th>
                      <th className="hidden px-3 py-2 font-medium md:table-cell">Tx</th>
                      <th className="px-3 py-2 text-right font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tips.slice(0, 20).map((t: any) => {
                      const token = TOKENS.find((item) => item.address.toLowerCase() === String(t.token || "").toLowerCase()) || currentToken;
                      const gross = safeBig(t.amount);
                      const fee = safeBig(t.fee_amount);
                      const toMaintainer = gross >= fee ? gross - fee : gross;
                      return (
                        <tr key={t.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono text-xs">{t.display_name || truncate(t.tipper_address)}</td>
                          <td className="px-3 py-2 font-mono text-xs text-brand tabular-nums">+{formatAmount(gross, token)} {token.symbol}</td>
                          <td className="hidden px-3 py-2 font-mono text-xs tabular-nums sm:table-cell">{formatAmount(toMaintainer, token)}</td>
                          <td className="hidden px-3 py-2 md:table-cell">
                            {t.tx_hash ? (
                              <a href={getBasescanTxUrl(t.tx_hash)} className="font-mono text-xs text-brand hover:underline" target="_blank" rel="noreferrer">{truncate(t.tx_hash)}</a>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-muted-foreground">{relTime(t.timestamp)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="min-w-0">
            <Segmented
              label="Repo details"
              value={detailTab}
              onChange={setDetailTab}
              options={[
                { value: "about", label: "About" },
                { value: "supporters", label: "Top supporters" },
              ]}
            />
            {detailTab === "about" ? (
              <div className="space-y-4 py-4">
                {summary ? (
                  <>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{summary.description}</p>
                    {summary.techStack.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {summary.techStack.map((tech) => (
                          <span key={tech} className="rounded-full border border-border px-2.5 py-1 text-xs">{tech}</span>
                        ))}
                      </div>
                    ) : null}
                    {summary.features.length > 0 ? (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {summary.features.map((feature) => <li key={feature}>{feature}</li>)}
                      </ul>
                    ) : null}
                    {summary.audience ? <p className="text-xs text-muted-foreground">Built for: {summary.audience}</p> : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No summary available yet.</p>
                )}
                {links.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {links.map((link) => (
                      <li key={link.url}>
                        <a href={link.url} className="text-sm text-brand hover:underline" target="_blank" rel="noreferrer">{link.title}</a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : tipsLoading ? (
              <div className="flex justify-center py-8"><Loader variant="dots" size={20} /></div>
            ) : supporters.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No tips yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {supporters.map((row) => (
                  <li key={row.tipper_address} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-mono text-xs">{row.display_name || truncate(row.tipper_address)}</span>
                    <span className="font-mono text-xs tabular-nums">{fmtUsd(row.usd)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          {isRegPending ? (
            <section className="flex justify-center py-12"><Loader variant="spinner" size={24} /></section>
          ) : !isRegistered ? (
            <section className="rounded-[10px] border border-border p-4">
              <h2 className="text-sm font-medium">Maintainer</h2>
              <div className="mt-3 space-y-4">
                <h3 className="font-display text-2xl">Claim this repo</h3>
                {!session ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Not claimed yet. Sign in to verify ownership and register this repo.</p>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => router.push("/onboarding")}>Get started</Button>
                      <Button variant="ghost" onClick={() => signIn("github")}>Sign in with GitHub</Button>
                    </div>
                  </div>
                ) : wallets.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">You need to link a wallet first. This wallet receives tips.</p>
                    <Button onClick={() => router.push("/onboarding")}>Link wallet →</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Verify you own <code className="font-mono text-sm">{repoIdLower}</code>, then register to start receiving tips. Payout defaults to your Opentip Smart Wallet.</p>
                    {wallets.length > 1 && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Payout wallet</label>
                        <select value={selectedPayout} onChange={e => setSelectedPayout(e.target.value)} className="h-9 w-full rounded-[10px] border border-border bg-transparent px-2 text-sm">
                          {wallets.map((w: any) => (
                            <option key={w.address} value={w.address}>{w.address.slice(0,6)}...{w.address.slice(-4)} {w.walletType==="smart"?"· Opentip Smart Wallet": w.isPrimary?"· Primary":""} </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {wallets.length === 1 && <p className="text-xs text-muted-foreground">Payout: {selectedPayout.slice(0,6)}...{selectedPayout.slice(-4)} {wallets[0].walletType==="smart"?"· Opentip Smart Wallet":""}</p>}
                    {ownership.loading ? (
                      <Loader variant="dots" />
                    ) : ownership.owns ? (
                      <div className="space-y-3">
                        <p className="text-sm text-emerald-700">Verified via {ownership.via}</p>
                        <StatefulButton state={registerState === "loading" ? "loading" : registerState === "success" ? "success" : registerState === "error" ? "error" : "idle"} onClick={onRegister}>
                          Register repo
                        </StatefulButton>
                      </div>
                    ) : ownership.owns === false ? (
                      <div className="space-y-3">
                        <p className="text-sm text-red-600">Not owner. Ensure you have admin/write on GitHub.</p>
                        <Button variant="secondary" onClick={checkOwnershipAndSign}>Re-check</Button>
                      </div>
                    ) : (
                      <Button onClick={checkOwnershipAndSign}>Verify ownership</Button>
                    )}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <>
              <section className="w-full rounded-[10px] border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-medium">Tip this repo</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-accent" />
                    {VIEM_CHAIN.name}
                  </span>
                </div>
                <div className="grid grid-cols-3" role="group" aria-label="Token">
                  <button type="button" aria-pressed={selectedToken === ETH_ADDRESS} onClick={() => { setSelectedToken(ETH_ADDRESS); setAmount("0.01"); setAmountError(undefined); }} className={`h-9 rounded-l-[10px] border border-border text-sm ${selectedToken === ETH_ADDRESS ? "bg-foreground text-background" : "bg-card"}`}>ETH</button>
                  <button type="button" aria-pressed={selectedToken === USDC_ADDRESS} onClick={() => { setSelectedToken(USDC_ADDRESS); setAmount("25"); setAmountError(undefined); }} className={`h-9 border border-x-0 border-border text-sm ${selectedToken === USDC_ADDRESS ? "bg-foreground text-background" : "bg-card"}`}>USDC</button>
                  <button type="button" className="h-9 rounded-r-[10px] border border-border text-xs text-muted-foreground" onClick={() => showToast({ title: "OAR is coming soon", status: "info" })}>OAR soon</button>
                </div>
                <div className="mt-4 rounded-[10px] border border-border px-4 py-3">
                  <div className="flex items-end justify-between gap-3">
                    <input
                      inputMode="decimal"
                      aria-label="Amount"
                      value={amount}
                      onChange={(e) => { const v = e.target.value; setAmount(v); setAmountError(validateAmount(v, currentToken, prices)); }}
                      className="w-full min-w-0 bg-transparent font-mono text-4xl tracking-tight tabular-nums outline-none"
                    />
                    <span className="pb-1 text-xs text-muted-foreground">{currentToken.symbol}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">≈ {usdHint > 0 ? fmtUsd(usdHint) : "$0"} · min $1</p>
                </div>
                {amountError ? <p className="mt-2 text-sm text-destructive">{amountError}</p> : null}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(PRESETS[selectedToken] || PRESETS[USDC_ADDRESS]).map((preset) => (
                    <button key={preset} type="button" onClick={() => { setAmount(preset); setAmountError(validateAmount(preset, currentToken, prices)); }} className={`h-8 rounded-full border text-xs ${amount === preset ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                      {selectedToken === USDC_ADDRESS ? `$${preset}` : preset}
                    </button>
                  ))}
                </div>
                {knownFee && split ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <SplitBar maintainerBps={maintainerBps} />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Maintainers · {bpsLabel(maintainerBps)}%</span>
                      <span className="font-mono text-foreground">{formatAmount(split.maintainer, currentToken)} {currentToken.symbol}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Platform fee · {bpsLabel(feeBps ?? 0)}%</span>
                      <span className="font-mono text-foreground">{formatAmount(split.fee, currentToken)} {currentToken.symbol}</span>
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Input value={displayName} onChange={setDisplayName} placeholder="Display name (optional)" aria-label="Display name" className="gap-0" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={saveDisplayName}>{displayNameSaveLabel}</Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {useSmart && smartAddr ? (
                    <span className="flex h-9 items-center gap-1.5 rounded-full border border-border px-2 font-mono text-xs" title="Tipping from your Opentip Smart Wallet">{smartAddr.slice(0, 6)}...{smartAddr.slice(-4)}<span className="rounded bg-foreground px-1.5 py-0.5 text-[0.6rem] text-background">SMART</span></span>
                  ) : isConnected ? (
                    <span className="flex h-9 items-center rounded-full border border-border px-2 font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  ) : (
                    <Button variant="secondary" onClick={() => open()} className="h-9">Connect wallet</Button>
                  )}
                </div>
                <StatefulButton className="mt-3 h-11 w-full" state={tipFlow==="approving"||tipFlow==="sending"?"loading": tipFlow==="success"?"success": tipFlow==="error"?"error":"idle"} onClick={openTipReview} disabled={tipFlow==="approving"||tipFlow==="sending"}>
                  {tipButtonText}
                </StatefulButton>
                <TxReviewModal
                  open={showTipReview}
                  onClose={() => setShowTipReview(false)}
                  title="Review tip"
                  rows={[
                    { label: "To repo", value: repoIdLower },
                    { label: "Amount", value: `${amount} ${currentToken.symbol}${usdHint > 0 ? ` (≈ ${fmtUsd(usdHint)})` : ""}` },
                  ]}
                  gas={{ sponsored: reviewSponsored, estimating: gasEstimating, estimate: gasEstimate }}
                  onConfirm={() => { setShowTipReview(false); onTipClick(); }}
                  confirming={tipFlow === "approving" || tipFlow === "sending"}
                  confirmLabel="Confirm"
                />
              </section>
              <section className="rounded-[10px] border border-border p-4">
                <h2 className="text-sm font-medium">Maintainer</h2>
                <p className="mt-3 text-xs text-muted-foreground">Pending balance</p>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {pendingRowsAll(pendingUSDC, pendingETH, pendingOAR).map((row) => (
                    <li key={row.token.symbol} className="flex items-center justify-between gap-3">
                      <span>{row.token.symbol}</span>
                      <span className="font-mono text-xs tabular-nums">
                        {formatAmount(row.raw, row.token)}
                        {pricesReady && usdOf(row.raw, row.token) != null ? ` · ${fmtUsd(usdOf(row.raw, row.token) ?? 0)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                {isPayoutWallet && hasPendingClaim ? (
                  <StatefulButton className="mt-3 w-full" state={claimState==="loading"?"loading": claimState==="success"?"success": claimState==="error"?"error":"idle"} onClick={onClaimAll} variant="secondary">
                    {claimButtonLabel}
                  </StatefulButton>
                ) : isPayoutWallet ? (
                  <Button className="mt-3 w-full" variant="secondary" disabled>Nothing to claim</Button>
                ) : null}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, pending, children }: { label: string; pending?: boolean; children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={pending ? "text-pending" : undefined}>{children}</div>
    </div>
  );
}

function pendingRowsAll(usdc: unknown, eth: unknown, oar: unknown) {
  return [
    { token: TOKENS[0], raw: (typeof usdc === "bigint" ? usdc : 0n) },
    { token: TOKENS[1], raw: (typeof eth === "bigint" ? eth : 0n) },
    { token: TOKENS[2], raw: (typeof oar === "bigint" ? oar : 0n) },
  ];
}

function safeBig(value: unknown) {
  try {
    if (typeof value === "bigint") return value;
    if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
    const text = String(value ?? "0").split(".")[0];
    return BigInt(text || "0");
  } catch {
    return 0n;
  }
}

function relTime(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toISOString().slice(0, 10);
}
