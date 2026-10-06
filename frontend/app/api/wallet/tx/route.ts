import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { formatAmountWithSymbol, truncateAddress } from "@/lib/formatAmount";
import { pushToUser } from "@/lib/notify";
import { createPublicClient, http } from "viem";
import { RPC_URL, VIEM_CHAIN, ETH_ADDRESS } from "@/lib/chain";

export const dynamic = "force-dynamic";

const KINDS = new Set(["send", "tip", "claim", "register"]);
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

const NOTIFY_KINDS: Record<string, { type: string; title: string }> = {
  send: { type: "send_out", title: "Sent" },
  tip: { type: "tip_sent", title: "Tip sent" },
  claim: { type: "claim_submitted", title: "Claim confirmed" },
  register: { type: "repo_registered", title: "Repo registered" },
};

type TxFields = {
  token: string | null;
  amount: string | null;
  repo_id: string | null;
  to_address: string | null;
};

// One notification per action, showing the final status. Amounts are
// formatted from base units; zero/unknown amounts are omitted, never "0".
function buildFinalBody(
  kind: string,
  f: TxFields,
): string {
  const amt = formatAmountWithSymbol(f.amount, f.token);
  switch (kind) {
    case "send":
      return amt
        ? `Sent ${amt} to ${truncateAddress(f.to_address)}`
        : `Sent funds to ${truncateAddress(f.to_address)}`;
    case "tip":
      return amt
        ? `You tipped ${amt} to ${f.repo_id}`
        : `Your tip to ${f.repo_id} is confirmed`;
    case "claim":
      return amt
        ? `You claimed ${amt} on ${f.repo_id}`
        : `Your claim on ${f.repo_id} is confirmed`;
    default:
      return `Your repo ${f.repo_id} is now registered`;
  }
}

async function ownWallet(userId: string, wallet: string) {
  const w = await prisma.userWallet.findFirst({
    where: { userId, address: wallet.toLowerCase() },
    select: { address: true },
  });
  return !!w;
}

// POST: record a submitted transaction (pending). Body:
// { walletAddress, kind, repoId?, token?, amount?, toAddress?, userOpHash?, txHash? }
// At least one of userOpHash / txHash required. Upserts by whichever id is given.
export async function POST(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "wallet-tx"), "write"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { walletAddress, kind, repoId, token, amount, toAddress, userOpHash, txHash } = body || {};
  if (typeof walletAddress !== "string" || !ADDRESS_RE.test(walletAddress)) {
    return NextResponse.json({ error: "invalid walletAddress" }, { status: 400 });
  }
  if (!KINDS.has(kind)) return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  if (userOpHash !== undefined && (typeof userOpHash !== "string" || !HASH_RE.test(userOpHash))) {
    return NextResponse.json({ error: "invalid userOpHash" }, { status: 400 });
  }
  if (txHash !== undefined && (typeof txHash !== "string" || !HASH_RE.test(txHash))) {
    return NextResponse.json({ error: "invalid txHash" }, { status: 400 });
  }
  if (!userOpHash && !txHash) {
    return NextResponse.json({ error: "userOpHash or txHash required" }, { status: 400 });
  }
  if (token !== undefined && (typeof token !== "string" || !ADDRESS_RE.test(token))) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }
  if (toAddress !== undefined && (typeof toAddress !== "string" || !ADDRESS_RE.test(toAddress))) {
    return NextResponse.json({ error: "invalid toAddress" }, { status: 400 });
  }

  const wallet = walletAddress.toLowerCase();
  if (!(await ownWallet(userId, wallet))) {
    return NextResponse.json({ error: "wallet not linked to account" }, { status: 403 });
  }

  const data = {
    wallet,
    kind,
    repo_id: typeof repoId === "string" ? repoId.toLowerCase().slice(0, 200) : null,
    token: typeof token === "string" ? token.toLowerCase() : null,
    amount: typeof amount === "string" ? amount.slice(0, 100) : null,
    to_address: typeof toAddress === "string" ? toAddress.toLowerCase() : null,
    status: txHash && !userOpHash ? "confirmed" : "pending",
  };
  try {
    const row = userOpHash
      ? await prisma.walletTx.upsert({
          where: { user_op_hash: userOpHash.toLowerCase() },
          create: { ...data, user_op_hash: userOpHash.toLowerCase(), tx_hash: txHash ? txHash.toLowerCase() : null },
          update: { ...(txHash ? { tx_hash: txHash.toLowerCase(), status: "confirmed" } : {}) },
        })
      : await prisma.walletTx.upsert({
          where: { tx_hash: (txHash as string).toLowerCase() },
          create: { ...data, tx_hash: (txHash as string).toLowerCase() },
          update: {},
        });
    // Single notification per action, final status only. Smart-wallet
    // submits create a silent pending row; the push goes out on confirm
    // (PATCH). EOA submits arrive already confirmed — push immediately.
    const info = NOTIFY_KINDS[kind];
    const refKey = (userOpHash ?? (txHash as string)).toLowerCase();
    const txHashLower = txHash ? (txHash as string).toLowerCase() : null;
    const finalBody = buildFinalBody(kind, {
      token: data.token,
      amount: data.amount,
      repo_id: data.repo_id,
      to_address: data.to_address,
    });
    const existing = await prisma.notification.findFirst({ where: { userId, ref: refKey } });
    const notif = existing ?? (await prisma.notification.create({
      data: { userId, type: info.type, title: info.title, body: finalBody, status: "pending", txHash: txHashLower, ref: refKey },
    }));
    if (txHash && !userOpHash) {
      const sent = await pushToUser(userId, { title: info.title, body: finalBody }, { type: info.type });
      if (sent) {
        await prisma.notification.update({ where: { id: notif.id }, data: { status: "sent" } });
      }
    }
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("wallet tx log failed", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

// PATCH: confirm a pending row once the chain hash is known. Body: { userOpHash, txHash }
export async function PATCH(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "wallet-tx"), "write"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { userOpHash, txHash } = body || {};
  if (typeof userOpHash !== "string" || !HASH_RE.test(userOpHash)) {
    return NextResponse.json({ error: "invalid userOpHash" }, { status: 400 });
  }
  if (typeof txHash !== "string" || !HASH_RE.test(txHash)) {
    return NextResponse.json({ error: "invalid txHash" }, { status: 400 });
  }
  try {
    const row = await prisma.walletTx.findUnique({ where: { user_op_hash: userOpHash.toLowerCase() } });
    if (!row || !(await ownWallet(userId, row.wallet))) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    await prisma.walletTx.update({
      where: { user_op_hash: userOpHash.toLowerCase() },
      data: { tx_hash: txHash.toLowerCase(), status: "confirmed" },
    });
    // Confirm the pending notification in place and send the single push.
    const info = NOTIFY_KINDS[row.kind] ?? { type: row.kind, title: "Transaction confirmed" };
    const finalBody = buildFinalBody(row.kind, {
      token: row.token,
      amount: row.amount,
      repo_id: row.repo_id,
      to_address: row.to_address,
    });
    const refKey = userOpHash.toLowerCase();
    const existing = await prisma.notification.findFirst({ where: { userId, ref: refKey } });
    if (existing) {
      await prisma.notification.update({
        where: { id: existing.id },
        data: { title: info.title, body: finalBody, status: "confirmed", txHash: txHash.toLowerCase() },
      });
    } else {
      await prisma.notification.create({
        data: { userId, type: info.type, title: info.title, body: finalBody, status: "confirmed", txHash: txHash.toLowerCase(), ref: refKey },
      });
    }
    await pushToUser(userId, { title: info.title, body: finalBody }, { type: info.type });
    // Reconcile the sponsorship ledger: match this confirmation to the
    // user's most recent pending SponsoredTx (proxy rows can't carry the
    // userOpHash — it doesn't exist yet at sponsor time) and backfill
    // actuals from the receipt. Best-effort; never fails the confirm.
    try {
      const sponsorRow = await prisma.sponsoredTx.findFirst({
        where: { userId, status: "pending", createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
        orderBy: { createdAt: "desc" },
      });
      if (sponsorRow) {
        let gasWei: string | null = null;
        let gasUsd: number | null = null;
        try {
          const client = createPublicClient({ chain: VIEM_CHAIN, transport: http(RPC_URL || undefined) });
          const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
          const price = (receipt as { effectiveGasPrice?: bigint }).effectiveGasPrice ?? 0n;
          gasWei = (receipt.gasUsed * price).toString();
          const host = req.headers.get("host");
          const proto = req.headers.get("x-forwarded-proto") ?? "http";
          if (host && gasWei !== "0") {
            const pr = await fetch(`${proto}://${host}/api/prices`).then((r) => r.json()).catch(() => null);
            const ethPrice = Number(pr?.[ETH_ADDRESS.toLowerCase()] ?? 0);
            if (ethPrice > 0) {
              const { formatUnits } = await import("viem");
              gasUsd = Number(formatUnits(BigInt(gasWei), 18)) * ethPrice;
            }
          }
        } catch {}
        await prisma.sponsoredTx.update({
          where: { id: sponsorRow.id },
          data: {
            txHash: txHash.toLowerCase(),
            status: "confirmed",
            ...(gasWei ? { gasWei } : {}),
            ...(gasUsd !== null && isFinite(gasUsd) ? { gasUsd } : {}),
          },
        });
      }
    } catch {}
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("wallet tx confirm failed", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
