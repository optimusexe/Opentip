"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useBalance, useReadContract, useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { formatUnits, parseUnits, encodeFunctionData, isAddress } from "viem";
import { erc20Abi } from "@/lib/contract";
import { CHAIN_ID, USDC_ADDRESS, OAR_ADDRESS, ETH_ADDRESS, getTokenDecimals } from "@/lib/chain";
import { useOpentipSend } from "@/lib/cdpSend";
import { logWalletTx, confirmWalletTx } from "@/lib/walletTx";
import { estimateGasUsd } from "@/lib/gasEstimate";
import { TxReviewRows } from "@/components/TxReviewModal";
import { Button } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import Modal from "@/components/motion/modal";
import { useToast } from "@/app/providers";
import CdpCreateWalletButton from "@/components/cdp/CdpCreateWalletButton";
import { Copy, ExternalLink, Fuel } from "lucide-react";

function truncate(a: string) { return a.slice(0, 6) + "..." + a.slice(-4); }

export default function WalletClient({ initialLinked }: { initialLinked?: any[] }) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { showToast } = useToast();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<"tokens"|"history">("tokens");
  const [showSend, setShowSend] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendToken, setSendToken] = useState<string>(ETH_ADDRESS);
  const [history, setHistory] = useState<any[]>([]);
  const [linked, setLinked] = useState<any[]>(initialLinked ?? []);
  const [linkedLoading, setLinkedLoading] = useState(() => !(initialLinked && initialLinked.length > 0));
  const [sendState, setSendState] = useState<"idle"|"sending"|"success"|"error">("idle");
  const [sendReview, setSendReview] = useState(false);
  const [sendHash, setSendHash] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | undefined>(undefined);
  const { send: cdpSend, txData: cdpTxData, ensureSignedIn } = useOpentipSend();
  // Sponsorship state (paymaster). `sponsor` feeds the gas meter;
  // review-modal fields are set fresh each time it opens.
  const [sponsor, setSponsor] = useState<{ sponsored: boolean; usedToday: number; cap: number } | null>(null);
  const [reviewSponsored, setReviewSponsored] = useState<boolean | null>(null);
  const [gasEstimating, setGasEstimating] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);

  const refreshSponsor = useCallback(async (): Promise<boolean | null> => {
    try {
      const r = await fetch("/api/paymaster/status");
      const j = await r.json();
      if (typeof j?.sponsored === "boolean") {
        setSponsor({ sponsored: j.sponsored, usedToday: j.usedToday ?? 0, cap: j.cap ?? 10 });
        return j.sponsored as boolean;
      }
    } catch {}
    return null;
  }, []);
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
  const ethSendTx = useSendTransaction();
  const ercSendW = useWriteContract();
  const ethSendReceipt = useWaitForTransactionReceipt({ hash: ethSendTx.data });
  const ercSendReceipt = useWaitForTransactionReceipt({ hash: ercSendW.data });

  useEffect(() => {
    fetch("/api/prices").then(r => r.json()).then(setPrices).catch(() => {});
    fetch("/api/wallet/link").then(r=>r.json()).then(j=>Array.isArray(j)?setLinked(j):setLinked([])).catch(()=>{}).finally(()=>setLinkedLoading(false));
    refreshSponsor();
  }, [refreshSponsor]);

  const smartWallet = linked.find((w:any)=>w.walletType==="smart")?.address as `0x${string}` | undefined;
  const primaryWallet = linked.find((w:any)=>w.isPrimary)?.address as `0x${string}` | undefined;
  const walletAddress = (smartWallet || primaryWallet || address) as `0x${string}` | undefined;

  const [chainUnavailable, setChainUnavailable] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  useEffect(() => {
    if (tab==="history" && walletAddress) {
      // Full wallet history: tips/claims (DB, with repo context) + transfers
      // and internal traces (chain — where smart-wallet ETH movements live)
      setHistoryLoading(true);
      fetch(`/api/wallet/history?address=${walletAddress}&limit=25`)
        .then(r=>r.json())
        .then(j=>{
          setHistory(Array.isArray(j.items)?j.items:[]);
          setChainUnavailable(!!j.chainUnavailable);
          setChainError(typeof j.chainError === "string" ? j.chainError : null);
        })
        .catch(()=>setHistory([]))
        .finally(()=>setHistoryLoading(false));
    }
  }, [tab, walletAddress]);

  const { data: ethBalance } = useBalance({ address: walletAddress, chainId: CHAIN_ID, query: { enabled: !!walletAddress } });
  const { data: usdcBalance } = useReadContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: walletAddress ? [walletAddress] : undefined, chainId: CHAIN_ID, query: { enabled: !!walletAddress } });
  const { data: oarBalance } = useReadContract({ address: OAR_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: walletAddress ? [walletAddress] : undefined, chainId: CHAIN_ID, query: { enabled: !!walletAddress } });

  const eth = ethBalance ? Number(formatUnits(ethBalance.value, 18)) : 0;
  const usdc = usdcBalance !== undefined ? Number(formatUnits(usdcBalance as bigint, 6)) : 0;
  const oar = oarBalance !== undefined ? Number(formatUnits(oarBalance as bigint, 18)) : 0;
  const ethPrice = prices[ETH_ADDRESS.toLowerCase()] || 0;
  const usdcPrice = prices[USDC_ADDRESS.toLowerCase()] || 1;
  const totalUsd = eth * ethPrice + usdc * usdcPrice + oar * (prices[OAR_ADDRESS.toLowerCase()] || 0);

  const displayAddress = walletAddress;
  const activeIsSmart = !!smartWallet && !!walletAddress && walletAddress.toLowerCase() === smartWallet.toLowerCase();

  // Warm the CDP session when the page opens so the first Send just
  // works — silent, no UI. send() also connects on click if needed,
  // so this is purely a head start.
  const warmedRef = useRef(false);
  useEffect(() => {
    if (!activeIsSmart || warmedRef.current) return;
    warmedRef.current = true;
    ensureSignedIn().catch(() => {
      warmedRef.current = false;
    });
  }, [activeIsSmart, ensureSignedIn]);

  // Gas info for the review modal: resolve sponsorship, then estimate
  // only when the user would actually pay. EOA sends are always user-paid.
  useEffect(() => {
    if (!sendReview) return;
    let cancelled = false;
    setReviewSponsored(null);
    setGasEstimate(null);
    setGasEstimating(true);
    (async () => {
      let sponsored: boolean | null = null;
      if (activeIsSmart) {
        sponsored = await refreshSponsor();
      } else {
        sponsored = false;
      }
      if (cancelled) return;
      setReviewSponsored(sponsored);
      if (sponsored === false) {
        const est = await estimateGasUsd("send", ethPrice);
        if (!cancelled) setGasEstimate(est);
      }
      if (!cancelled) setGasEstimating(false);
    })();
    return () => { cancelled = true; };
  }, [sendReview, activeIsSmart, refreshSponsor, ethPrice]);

  // Re-tick the gas meter after a successful send.
  useEffect(() => {
    if (sendState === "success") refreshSponsor();
  }, [sendState, refreshSponsor]);

  const copy = async (v: string) => { await navigator.clipboard.writeText(v); showToast({ status: "success", title: "Copied" }); };

  const sendTokenDecimals = sendToken === USDC_ADDRESS ? 6 : 18;
  const sendBalance = sendToken === USDC_ADDRESS ? usdc : sendToken === ETH_ADDRESS ? eth : oar;

  const validateSend = () => {
    if (!isAddress(sendTo)) return "Enter a valid 0x address";
    const n = Number(sendAmount);
    if (!sendAmount || isNaN(n) || n <= 0) return "Enter an amount";
    try { parseUnits(sendAmount, sendTokenDecimals); } catch { return "Invalid amount"; }
    if (n > sendBalance) return "Amount exceeds balance";
    return undefined;
  };

  const openSend = () => {
    setSendState("idle"); setSendReview(false); setSendHash(null); setSendError(undefined);
    setPendingUserOp(null);
    setShowSend(true);
  };

  const reviewSymbol = sendToken === ETH_ADDRESS ? "ETH" : sendToken === USDC_ADDRESS ? "USDC" : "OAR";
  const reviewPrice = sendToken === ETH_ADDRESS ? ethPrice : sendToken === USDC_ADDRESS ? usdcPrice : (prices[OAR_ADDRESS.toLowerCase()] || 0);
  const reviewUsd = (Number(sendAmount) || 0) * reviewPrice;

  const goReview = () => {
    const err = validateSend();
    if (err) { showToast({ status: "error", title: err }); return; }
    setSendError(undefined);
    setSendReview(true);
  };

  const onSendContinue = async () => {
    const err = validateSend();
    if (err) { showToast({ status: "error", title: err }); return; }
    if (activeIsSmart) {
      setSendState("sending"); setSendError(undefined);
      try {
        const units = parseUnits(sendAmount, sendTokenDecimals);
        const calls = sendToken === ETH_ADDRESS
          ? [{ to: sendTo as `0x${string}`, value: units, data: "0x" as `0x${string}` }]
          : [{ to: sendToken as `0x${string}`, data: encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [sendTo as `0x${string}`, units] }) }];
        const { userOperationHash, sponsored, selfPaidBecause } = await cdpSend(calls);
        if (userOperationHash && walletAddress) {
          setPendingUserOp(userOperationHash);
          logWalletTx({ walletAddress, kind: "send", token: sendToken, amount: units.toString(), toAddress: sendTo, userOpHash: userOperationHash });
        }
        setSendHash(userOperationHash || null);
        setSendState("success");
        showToast({ status: "success", title: "Send submitted", description: sponsored === false ? (selfPaidBecause === "paymaster" ? "Paymaster unavailable — you paid gas this time" : "Daily sponsorship used up — you paid gas this time") : undefined });
      } catch (e: any) {
        setSendError(e.message?.slice(0, 160) || "Send failed");
        setSendState("error");
      }
      return;
    }
    // Linked EOA via connected wallet
    if (!isConnected || !address) { showToast({ status: "error", title: "Connect wallet" }); return; }
    setSendState("sending"); setSendError(undefined);
    try {
      const units = parseUnits(sendAmount, sendTokenDecimals);
      if (sendToken === ETH_ADDRESS) {
        ethSendTx.sendTransaction({ to: sendTo as `0x${string}`, value: units });
      } else {
        ercSendW.writeContract({ address: sendToken as `0x${string}`, abi: erc20Abi, functionName: "transfer", args: [sendTo as `0x${string}`, units] });
      }
    } catch (e: any) {
      setSendError(e.message?.slice(0, 160) || "Send failed");
      setSendState("error");
    }
  };

  // EOA send receipts
  useEffect(() => {
    if (sendState !== "sending" || activeIsSmart) return;
    if (ethSendReceipt.isSuccess && ethSendTx.data) {
      if (address) {
        try {
          logWalletTx({ walletAddress: address, kind: "send", token: ETH_ADDRESS, amount: parseUnits(sendAmount, 18).toString(), toAddress: sendTo, txHash: ethSendTx.data });
        } catch {}
      }
      setSendHash(ethSendTx.data); setSendState("success");
      showToast({ status: "success", title: "Sent" });
    } else if (ercSendReceipt.isSuccess && ercSendW.data) {
      if (address) {
        try {
          logWalletTx({ walletAddress: address, kind: "send", token: sendToken, amount: parseUnits(sendAmount, sendTokenDecimals).toString(), toAddress: sendTo, txHash: ercSendW.data });
        } catch {}
      }
      setSendHash(ercSendW.data); setSendState("success");
      showToast({ status: "success", title: "Sent" });
    } else if (ethSendReceipt.isError || ercSendReceipt.isError) {
      const msg = ((ethSendReceipt.error || ercSendReceipt.error) as any)?.message?.slice(0, 160) || "Send failed";
      setSendError(msg); setSendState("error");
    }
  }, [sendState, activeIsSmart, ethSendReceipt.isSuccess, ethSendReceipt.isError, ercSendReceipt.isSuccess, ercSendReceipt.isError]);

  // Never show the Create CTA while the wallet list is still loading —
  // a hasty click there would strand funds in a second, unrecoverable
  // wallet. The empty state renders only after zero wallets is confirmed.
  if (!walletAddress) {
    if (linkedLoading) {
      return (
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 space-y-6">
          <h1 className="serif text-2xl font-semibold">Wallet</h1>
          <div className="border rule rounded-sm p-6 space-y-3 animate-pulse" aria-label="Loading wallet">
            <div className="h-4 bg-zinc-900/10 rounded-sm w-2/3" />
            <div className="h-9 bg-zinc-900/10 rounded-sm" />
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 space-y-6">
        <h1 className="serif text-2xl font-semibold">Wallet</h1>
        <div className="border rule rounded-sm p-6 text-center space-y-3">
          <p className="text-sm text-zinc-600">Create your Opentip Smart Wallet to see balances, or connect an existing wallet.</p>
          {!process.env.NEXT_PUBLIC_CDP_PROJECT_ID && <p className="text-xs text-red-600">Missing NEXT_PUBLIC_CDP_PROJECT_ID — add it to .env and restart dev.</p>}
          <div className="flex gap-2 justify-center">
            <CdpCreateWalletButton onCreated={() => location.reload()} />
            <Button size="sm" variant="secondary" onClick={() => open()}>Connect wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="serif text-2xl font-semibold">Wallet</h1>
      </div>

      {/* Address — Opentip Smart Wallet first */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="stats text-sm text-zinc-900">{truncate(displayAddress!)}</span>
        {smartWallet && <span className="text-[0.6rem] bg-zinc-900 text-white px-1.5 py-0.5 rounded">SMART</span>}
        {!smartWallet && primaryWallet && <span className="text-[0.6rem] border rule px-1.5 py-0.5 rounded">PRIMARY</span>}
        <button onClick={() => copy(displayAddress!)} className="p-1 hover:text-zinc-900"><Copy className="h-3.5 w-3.5" /></button>
        <a href={`https://basescan.org/address/${displayAddress}`} target="_blank" rel="noreferrer" className="p-1 hover:text-zinc-900"><ExternalLink className="h-3.5 w-3.5" /></a>
      </div>

      {/* Total */}
      <div className="border-b rule pb-6">
        <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Total balance</div>
        <div className="stats text-4xl font-semibold mt-1">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        {activeIsSmart && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500" title="Sponsored transactions used today — resets daily">
            <Fuel className="h-3.5 w-3.5" />
            {sponsor ? (
              <span className="stats">{sponsor.usedToday}/{sponsor.cap} sponsored today</span>
            ) : (
              <span className="stats animate-pulse">…/…</span>
            )}
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <Button size="sm" onClick={openSend} className="flex-1">Send</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowDeposit(true)} className="flex-1">Deposit</Button>
        </div>
      </div>

      <Modal open={showDeposit} onClose={() => setShowDeposit(false)} title="Deposit">
        <p className="text-xs text-zinc-600">Send ETH, USDC or OAR to this address on Base:</p>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-zinc-900 text-white px-2 py-1 rounded flex-1 truncate">{displayAddress!}</code>
          <Button size="sm" variant="ghost" onClick={() => copy(displayAddress!)}>Copy</Button>
        </div>
        <p className="text-xs text-zinc-500">Or use Coinbase Onramp for USDC on Base (0 fees).</p>
      </Modal>

      <Modal open={showSend} onClose={() => setShowSend(false)} title="Send">
        {sendState === "success" ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700">Sent {sendAmount} {reviewSymbol}</p>
            {sendHash && <p className="text-xs text-zinc-500 break-all">{activeIsSmart ? "UserOp" : "Tx"}: {sendHash}</p>}
            {activeIsSmart && (cdpTxData as any)?.transactionHash && (
              <a href={`https://basescan.org/tx/${(cdpTxData as any).transactionHash}`} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">View on Basescan →</a>
            )}
            {!activeIsSmart && sendHash && (
              <a href={`https://basescan.org/tx/${sendHash}`} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">View on Basescan →</a>
            )}
            <Button size="sm" className="w-full" onClick={() => setShowSend(false)}>Done</Button>
          </div>
        ) : sendReview ? (
          <div className="space-y-3">
            <TxReviewRows
              rows={[
                { label: "From", value: <>{truncate(displayAddress!)} {activeIsSmart ? "· SMART" : ""}</> },
                { label: "To", value: <>{sendTo.slice(0, 6)}...{sendTo.slice(-4)}</> },
                { label: "Amount", value: <>{sendAmount} {reviewSymbol}{reviewUsd > 0 ? ` (≈ $${reviewUsd.toFixed(2)})` : ""}</> },
                { label: "Network", value: <>Base</> },
              ]}
              gas={{ sponsored: reviewSponsored, estimating: gasEstimating, estimate: gasEstimate }}
            />
            {sendState === "error" && sendError && <p className="text-xs text-red-600">{sendError}</p>}
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => { setSendReview(false); setSendState("idle"); setSendError(undefined); }} disabled={sendState === "sending"}>Cancel</Button>
              <Button size="sm" className="flex-1" onClick={onSendContinue} disabled={sendState === "sending"}>
                {sendState === "sending" ? "Sending..." : "Confirm send"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">From {truncate(displayAddress!)} {activeIsSmart ? "· SMART" : "· connected wallet"}</p>
            <Input value={sendTo} onChange={setSendTo} placeholder="0x..." className="flex-1" />
            <div className="flex gap-2">
              <Input value={sendAmount} onChange={setSendAmount} placeholder="Amount" className="flex-1" />
              <select value={sendToken} onChange={e => setSendToken(e.target.value)} className="h-9 border rule rounded-sm px-2 text-sm bg-transparent">
                <option value={ETH_ADDRESS}>ETH</option>
                <option value={USDC_ADDRESS}>USDC</option>
                <option value={OAR_ADDRESS}>OAR</option>
              </select>
            </div>
            <Button size="sm" className="w-full" onClick={goReview}>Review</Button>
          </div>
        )}
      </Modal>

      {/* Tabs */}
      <div className="flex gap-6 border-b rule">
        <button onClick={() => setTab("tokens")} className={`pb-2 text-sm ${tab==="tokens" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}>Tokens</button>
        <button onClick={() => setTab("history")} className={`pb-2 text-sm ${tab==="history" ? "border-b-2 border-zinc-900 font-medium" : "text-zinc-500"}`}>History</button>
      </div>

      {tab==="tokens" ? (
        <div className="divide-y rule border rule rounded-sm">
          <div className="flex justify-between items-center px-4 py-3">
            <div><div className="text-sm font-medium">ETH</div><div className="text-xs text-zinc-500">Ethereum</div></div>
            <div className="text-right"><div className="stats text-sm">{eth.toFixed(4)}</div><div className="text-xs text-zinc-500">${(eth*ethPrice).toFixed(2)}</div></div>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <div><div className="text-sm font-medium">USDC</div><div className="text-xs text-zinc-500">USD Coin</div></div>
            <div className="text-right"><div className="stats text-sm">{usdc.toFixed(2)}</div><div className="text-xs text-zinc-500">${(usdc*usdcPrice).toFixed(2)}</div></div>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <div><div className="text-sm font-medium">OAR</div><div className="text-xs text-zinc-500">Oarcoin</div></div>
            <div className="text-right"><div className="stats text-sm">{oar.toFixed(4)}</div><div className="text-xs text-zinc-500">${(oar * (prices[OAR_ADDRESS.toLowerCase()] || 0)).toFixed(2)}</div></div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {chainUnavailable && !chainError && <p className="text-xs text-zinc-500">Showing Opentip tips only — full chain history needs an explorer key.</p>}
          {chainUnavailable && chainError && <p className="text-xs text-red-600">Chain history unavailable ({chainError}) — showing Opentip tips and claims only.</p>}
          {historyLoading ? (
            [0,1,2].map(i => (
              <div key={i} className="flex justify-between items-center border rule rounded-sm px-3 py-2 animate-pulse">
                <div className="space-y-1.5"><div className="h-3 w-32 bg-zinc-900/10 rounded-sm" /><div className="h-2.5 w-20 bg-zinc-900/10 rounded-sm" /></div>
                <div className="h-3 w-16 bg-zinc-900/10 rounded-sm" />
              </div>
            ))
          ) : history.length===0 ? <p className="text-xs text-zinc-500 py-6 text-center">No history yet.</p> : history.map((h:any)=>{
            const decimals = h.decimals ?? getTokenDecimals(h.token);
            const val = h.amount ? Number(h.amount)/Math.pow(10,decimals) : 0;
            const formatted = decimals === 6 ? val.toFixed(2) : val >= 1000 ? `${(val/1000).toFixed(1)}k` : val >= 1 ? val.toFixed(2) : val.toFixed(4);
            const isOut = h.direction !== "in";
            const label = h.kind === "tip" ? (isOut ? "Tipped" : "Tip received") : h.kind === "claim" ? "Claimed" : h.kind === "register" ? "Registered" : isOut ? "Sent" : "Received";
            const detail = h.repo_id || (h.counterparty ? `${h.counterparty.slice(0,6)}...${h.counterparty.slice(-4)}` : "—");
            // Ticker comes from untrusted sources (Alchemy asset names, stored values).
            // Strip anything non-alphanumeric so combining marks, zero-width chars,
            // or odd glyphs can never render (e.g. a dotted "Ṫ" in ETH).
            const symbol = (h.symbol || "").toString().replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12) || "—";
            const pending = h.status === "pending";
            return (
            <div key={`${h.direction}-${h.kind}-${h.hash}`} className="flex justify-between items-center border rule rounded-sm px-3 py-2">
              <div className="text-xs">
                <div className="font-medium flex items-center gap-2">
                  <span className={isOut ? "text-red-600" : "text-emerald-700"}>{label}</span>
                  {pending && <span className="text-[0.6rem] border rule px-1.5 py-0.5 rounded text-zinc-500">PENDING</span>}
                  <span className="text-zinc-500">{detail}</span>
                </div>
                <div className="text-zinc-500">{new Date(h.timestamp).toLocaleDateString()}</div>
              </div>
              <div className="text-right"><div className="stats text-sm">{isOut ? "−" : "+"}{formatted} {symbol}</div>{h.isUserOp ? <span className="text-xs text-zinc-500">UserOp {h.hash?.slice(0,6)}...</span> : <a href={`https://basescan.org/tx/${h.hash}`} target="_blank" className="text-xs text-accent hover:underline">{h.hash?.slice(0,6)}...</a>}</div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
