"use client";
import { useEffect, useState, useRef } from "react";
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
import { markInstallTipped } from "@/components/installPrompt";
import { useToast } from "@/app/providers";
import { Input } from "@/components/motion/input";
import { Button, StatefulButton } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { Coins, Wallet, Copy } from "lucide-react";

function truncate(addr: string){ return addr.slice(0,6)+"..."+addr.slice(-4); }

type TokenInfo = { symbol: string; decimals: number; name: string; address: `0x${string}` };
const TOKENS: TokenInfo[] = [
  { symbol: "USDC", decimals: 6, name: "USD Coin", address: USDC_ADDRESS },
  { symbol: "ETH", decimals: 18, name: "Ethereum", address: ETH_ADDRESS },
  { symbol: "OAR", decimals: 18, name: "Oarcoin", address: OAR_ADDRESS },
];

function formatAmount(raw: bigint, token: TokenInfo): string {
  const formatted = formatUnits(raw, token.decimals);
  const n = parseFloat(formatted);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

export default function TipClient({ repoId }: { repoId: string }) {
  const router = useRouter();
  const repoIdLower = repoId.toLowerCase();
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { open } = useAppKit();
  const { data: session } = useSession();
  const { showToast, dismissToast } = useToast();
  const { signMessageAsync } = useSignMessage();
  const { send: cdpSend, txData: cdpTxData } = useOpentipSend();
  const [pendingUserOp, setPendingUserOp] = useState<string | null>(null);
  const patchedOps = useRef<Set<string>>(new Set());

  // Confirm write-ahead log rows once the chain hash is known
  useEffect(() => {
    const txHash = (cdpTxData as any)?.transactionHash;
    if (txHash && pendingUserOp && !patchedOps.current.has(pendingUserOp)) {
      patchedOps.current.add(pendingUserOp);
      confirmWalletTx(pendingUserOp, txHash);
    }
  }, [cdpTxData, pendingUserOp]);
  const contract = CONTRACT_ADDRESS;
  const cdpConfigured = !!process.env.NEXT_PUBLIC_CDP_PROJECT_ID;

  const { data: isRegistered, isPending: isRegPending } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "isRegistered", args: [repoIdLower], chainId: CHAIN_ID, query: { enabled: !!contract } });
  const { data: payout } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getPayoutAddress", args: [repoIdLower], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });
  const { data: totalTipCount, isPending: isCountPending } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getTotalTipCount", args: [repoIdLower], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });

  // Per-token pending balances
  const { data: pendingUSDC } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getPendingBalance", args: [repoIdLower, USDC_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });
  const { data: pendingETH } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getPendingBalance", args: [repoIdLower, ETH_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });
  const { data: pendingOAR } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getPendingBalance", args: [repoIdLower, OAR_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract && !!isRegistered } });

  // Per-token total tipped
  const { data: totalUSDC } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getTotalTipped", args: [repoIdLower, USDC_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract } });
  const { data: totalETH } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getTotalTipped", args: [repoIdLower, ETH_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract } });
  const { data: totalOAR } = useReadContract({ address: contract, abi: opentipV2Abi, functionName: "getTotalTipped", args: [repoIdLower, OAR_ADDRESS], chainId: CHAIN_ID, query: { enabled: !!contract } });

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
    if (price > 0 && n * price < 1) return "Minimum tip is $1";
    return undefined;
  };

  // ERC-20 approve receipt
  useEffect(()=>{
    if (tipFlow==="approving" && approveReceipt.isSuccess && approveW.data) {
      const baseUnits = parseUnits(amount, currentToken.decimals);
      setTipFlow("sending");
      showLoading("Sending tip...", `${amount} ${currentToken.symbol} → ${repoIdLower}`);
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
      showToast({ status:"success", title:"Tip sent", description:`${amount} ${currentToken.symbol} → ${repoIdLower}` });
      markInstallTipped();
      setTipFlow("success"); setTimeout(()=>setTipFlow("idle"), 1600);
      fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{});
      fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{});
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
      showToast({ status:"success", title:"Tip sent", description:`${amount} ETH → ${repoIdLower}` });
      markInstallTipped();
      setTipFlow("success"); setTimeout(()=>setTipFlow("idle"), 1600);
      fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{});
      fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{});
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
      setTimeout(()=>setClaimState("idle"),1600);
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
      showLoading("Sending tip...", `${amount} ${currentToken.symbol} → ${repoIdLower}`);
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
        const { userOperationHash, sponsored } = await cdpSend(calls);
        if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
        if (userOperationHash && smartAddr) {
          setPendingUserOp(userOperationHash);
          logWalletTx({ walletAddress: smartAddr, kind: "tip", repoId: repoIdLower, token: selectedToken, amount: baseUnits.toString(), toAddress: contract, userOpHash: userOperationHash });
        }
        showToast({ status:"success", title:"Tip sent", description:`${amount} ${currentToken.symbol} → ${repoIdLower}${sponsored === false ? " (you paid gas — daily sponsorship used up)" : ""}${userOperationHash ? ` (${userOperationHash.slice(0,10)}…)` : ""}` });
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
      showLoading("Sending ETH tip...", `${amount} ETH → ${repoIdLower}`);
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
      showLoading("Sending tip...", `${amount} ${currentToken.symbol} → ${repoIdLower}`);
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
    if (!address || !displayName) { showToast({ status:"error", title:"Enter a display name" }); return; }
    const message = `Set display name: ${displayName} for ${address}`;
    try {
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/display-name", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ address, displayName, signature })});
      if (!res.ok) throw new Error(await res.text());
      showToast({ status:"success", title:"Display name saved", description: displayName });
    } catch(e:any){ showToast({ status:"error", title:"Save failed", description: e.message?.slice(0,100) }); }
  };

  const tipButtonText = tipFlow==="approving" ? "Approving spend..." : tipFlow==="sending" ? "Sending..." : tipFlow==="success" ? "Tip sent" : tipFlow==="error" ? "Try again" : `Tip ${amount} ${currentToken.symbol}`;

  const pendingBalances = [
    { token: TOKENS[0], raw: pendingUSDC as bigint | undefined },
    { token: TOKENS[1], raw: pendingETH as bigint | undefined },
    { token: TOKENS[2], raw: pendingOAR as bigint | undefined },
  ].filter(b => b.raw && b.raw > 0n);

  const hasPendingClaim = pendingBalances.length > 0;

  if (contract === undefined) return <div className="py-12 text-sm text-zinc-600">Contract address not configured.</div>;

  return (
    <div className="space-y-0">

      {/* Stats strip */}
      <section className="py-8 border-b rule">
        <div className="flex flex-col sm:flex-row sm:divide-x rule">
          <div className="flex-1 sm:px-4 py-2 sm:py-0">
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Pending</div>
            <div className="mt-2 space-y-1">
              {pendingBalances.length === 0 ? (
                <div className="stats text-lg text-zinc-400">—</div>
              ) : pendingBalances.map(b => (
                <div key={b.token.symbol} className="stats text-lg flex items-baseline gap-2 text-zinc-900">
                  {formatAmount(b.raw!, b.token)}
                  <span className="text-xs text-zinc-500 font-sans">{b.token.symbol}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 sm:px-4 py-2 sm:py-0">
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Total tipped</div>
            <div className="mt-2 space-y-1">
              {totalUSDC && (totalUSDC as bigint) > 0n && (
                <div className="stats text-lg flex items-baseline gap-2 text-zinc-900">
                  {formatAmount(totalUSDC as bigint, TOKENS[0])}
                  <span className="text-xs text-zinc-500 font-sans">USDC</span>
                </div>
              )}
              {totalETH && (totalETH as bigint) > 0n && (
                <div className="stats text-lg flex items-baseline gap-2 text-zinc-900">
                  {formatAmount(totalETH as bigint, TOKENS[1])}
                  <span className="text-xs text-zinc-500 font-sans">ETH</span>
                </div>
              )}
              {totalOAR && (totalOAR as bigint) > 0n && (
                <div className="stats text-lg flex items-baseline gap-2 text-zinc-900">
                  {formatAmount(totalOAR as bigint, TOKENS[2])}
                  <span className="text-xs text-zinc-500 font-sans">OAR</span>
                </div>
              )}
              {(!totalUSDC || (totalUSDC as bigint) === 0n) && (!totalETH || (totalETH as bigint) === 0n) && (!totalOAR || (totalOAR as bigint) === 0n) && (
                <div className="stats text-lg text-zinc-400">—</div>
              )}
            </div>
          </div>
          <div className="flex-1 sm:px-4 py-2 sm:py-0">
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Tips</div>
            <div className="stats mt-2 text-lg text-zinc-900">{isCountPending ? <Loader size={16} variant="dots" /> : totalTipCount?.toString() || "0"}</div>
          </div>
          <div className="flex-1 sm:px-4 py-2 sm:py-0">
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Payout</div>
            <div className="stats mt-2 text-sm text-zinc-700">{payout ? truncate(payout as string) : "—"}</div>
          </div>
        </div>
      </section>

      {/* Unclaimed */}
      {isRegPending ? (
        <section className="py-12 flex justify-center"><Loader variant="spinner" size={24} /></section>
      ) : !isRegistered ? (
        <section className="py-10 border-b rule space-y-4">
          <h2 className="serif text-2xl font-semibold">Claim this repo</h2>
          {!session ? (
            <div className="space-y-4">
              <p className="text-zinc-600 max-w-lg">Not claimed yet. Sign in to verify ownership and register this repo.</p>
              <div className="flex gap-3">
                <Button onClick={() => router.push("/onboarding")}>Get started</Button>
                <Button variant="ghost" onClick={() => signIn("github")}>Sign in with GitHub</Button>
              </div>
            </div>
          ) : wallets.length === 0 ? (
            <div className="space-y-4">
              <p className="text-zinc-600 max-w-lg">You need to link a wallet first. This wallet receives tips.</p>
              <Button onClick={() => router.push("/onboarding")}>Link wallet →</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-zinc-600 max-w-lg">Verify you own <code className="font-mono text-sm">{repoIdLower}</code>, then register to start receiving tips. Payout defaults to your Opentip Smart Wallet.</p>
              {wallets.length > 1 && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Payout wallet</label>
                  <select value={selectedPayout} onChange={e => setSelectedPayout(e.target.value)} className="h-9 border rule rounded-sm px-2 text-sm bg-transparent">
                    {wallets.map((w: any) => (
                      <option key={w.address} value={w.address}>{w.address.slice(0,6)}...{w.address.slice(-4)} {w.walletType==="smart"?"· Opentip Smart Wallet": w.isPrimary?"· Primary":""} </option>
                    ))}
                  </select>
                </div>
              )}
              {wallets.length === 1 && <p className="text-xs text-zinc-500">Payout: {selectedPayout.slice(0,6)}...{selectedPayout.slice(-4)} {wallets[0].walletType==="smart"?"· Opentip Smart Wallet":""}</p>}
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
        </section>
      ) : (
        /* Registered — tip form */
        <section className="py-10 border-b rule space-y-6">
          <h2 className="serif text-2xl font-semibold">Tip {capitalize(repoIdLower.split("/")[1])}</h2>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-0 max-w-[200px]">
              <Input value={amount} onChange={(v)=>{ setAmount(v); setAmountError(validateAmount(v, currentToken, prices)); }} error={amountError} leftIcon={isETH ? <Wallet /> : <Coins />} placeholder="Amount" className="gap-0" />
            </div>
            <select value={selectedToken} onChange={e=>{ if (e.target.value === OAR_ADDRESS) { showToast({ title: "OAR tipping coming soon", status: "info" }); return; } setSelectedToken(e.target.value); setAmountError(undefined); }} className="h-9 bg-transparent border rule rounded-sm px-3 text-sm text-zinc-900">
              <option value={USDC_ADDRESS}>USDC</option>
              <option value={ETH_ADDRESS}>ETH</option>
              <option value={OAR_ADDRESS}>OAR</option>
            </select>
            {useSmart && smartAddr ? (
              <span className="stats text-xs text-zinc-700 border rule rounded-sm px-2 py-1 h-9 flex items-center gap-1.5" title="Tipping from your Opentip Smart Wallet">{smartAddr.slice(0, 6)}...{smartAddr.slice(-4)}<span className="text-[0.6rem] bg-zinc-900 text-white px-1.5 py-0.5 rounded">SMART</span></span>
            ) : isConnected ? (
              <span className="stats text-xs text-zinc-700 border rule rounded-sm px-2 py-1 h-9 flex items-center">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            ) : (
              <Button variant="secondary" onClick={() => open()} className="h-9">Connect wallet</Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-full max-w-[280px]">
              <Input value={displayName} onChange={setDisplayName} placeholder="Display name (optional)" className="gap-0" />
            </div>
            <Button variant="ghost" size="sm" onClick={saveDisplayName}>Save</Button>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <StatefulButton state={tipFlow==="approving"||tipFlow==="sending"?"loading": tipFlow==="success"?"success": tipFlow==="error"?"error":"idle"} onClick={openTipReview} disabled={tipFlow==="approving"||tipFlow==="sending"}>
              {tipButtonText}
            </StatefulButton>
            {((address && payout && (address.toLowerCase() === (payout as string).toLowerCase())) || (useSmart && smartAddr && payout && (payout as string).toLowerCase() === smartAddr.toLowerCase())) && hasPendingClaim && (
              <StatefulButton state={claimState==="loading"?"loading": claimState==="success"?"success": claimState==="error"?"error":"idle"} onClick={onClaimAll} variant="secondary">
                Claim tips
              </StatefulButton>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={copyLink}><Copy className="h-3.5 w-3.5" /> Copy tip link</Button>
          <TxReviewModal
            open={showTipReview}
            onClose={() => setShowTipReview(false)}
            title="Review tip"
            rows={[
              { label: "To repo", value: repoIdLower },
              { label: "Amount", value: `${amount} ${currentToken.symbol}${(() => { const u = (Number(amount) || 0) * (prices[selectedToken.toLowerCase()] || 0); return u > 0 ? ` (≈ $${u.toFixed(2)})` : ""; })()}` },
            ]}
            gas={{ sponsored: reviewSponsored, estimating: gasEstimating, estimate: gasEstimate }}
            onConfirm={() => { setShowTipReview(false); onTipClick(); }}
            confirming={tipFlow === "approving" || tipFlow === "sending"}
            confirmLabel="Confirm tip"
          />
        </section>
      )}

      {/* Feeds */}
      <section className="py-10 grid md:grid-cols-2 gap-10">
        <div>
          <h3 className="serif font-semibold text-sm">Top supporters</h3>
          {tipsLoading ? (
            <div className="py-8 flex justify-center"><Loader variant="dots" size={20} /></div>
          ) : leaderboard.length===0 ? (
            <p className="text-xs text-zinc-500 mt-3">No tips yet.</p>
          ) : (
            <ul className="mt-3 divide-y rule">
              {(() => {
                const merged = new Map<string, { display_name: string|null; tipper_address: string; usd: number }>();
                for (const r of leaderboard as any[]) {
                  const key = r.tipper_address.toLowerCase();
                  if (!merged.has(key)) merged.set(key, { display_name: r.display_name, tipper_address: r.tipper_address, usd: 0 });
                  const entry = merged.get(key)!;
                  const decimals = r.decimals ?? getTokenDecimals(r.token);
                  const amount = Number(r.total) / Math.pow(10, decimals);
                  const price = prices[r.token?.toLowerCase()] ?? 0;
                  entry.usd += amount * price;
                }
                return [...merged.values()].sort((a, b) => b.usd - a.usd).slice(0, 10).map((r) => (
                  <li key={r.tipper_address} className="flex justify-between py-3">
                    <span className="text-sm text-zinc-700">{r.display_name || truncate(r.tipper_address)}</span>
                    <span className="stats text-sm text-zinc-900">{fmtUsd(r.usd)}</span>
                  </li>
                ));
              })()}
            </ul>
          )}
        </div>
        <div>
          <h3 className="serif font-semibold text-sm">Recent tips</h3>
          {tipsLoading ? (
            <div className="py-8 flex justify-center"><Loader variant="dots" size={20} /></div>
          ) : tips.length===0 ? (
            <p className="text-xs text-zinc-500 mt-3">No tips.</p>
          ) : (
            <ul className="mt-3 divide-y rule">
              {tips.slice(0,10).map((t:any)=>(
                <li key={t.id} className="flex justify-between py-3">
                  <span className="text-xs text-zinc-600">{truncate(t.tipper_address)}</span>
                  <span className="stats text-sm text-zinc-900">{(Number(t.amount)/Math.pow(10,getTokenDecimals(t.token))).toFixed(2)} {t.symbol || "USDC"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
