import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import {
  SPONSOR_CAP_PER_DAY,
  isPaymasterHealthy,
  recordPaymasterFailure,
  recordPaymasterSuccess,
  sponsoredToday,
} from "@/lib/paymaster";
import { getPolicy } from "@/lib/policy";

export const dynamic = "force-dynamic";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

// Paymaster proxy: forwards ERC-7677 bundler/paymaster calls to the CDP
// Paymaster & Bundler endpoint without exposing the URL (which carries
// our client API key) to the browser.
//
// Dual caller modes — CDP never tells us which side calls this URL, so
// both are supported:
//   1. Browser (session cookie present): user known directly, cap enforced.
//   2. CDP backend server-to-server (no cookie): the sender wallet address
//      is read out of the request params and mapped to a user via
//      UserWallet. Unknown sender is rejected — fails closed.
// Only pm_getPaymasterData commits sponsorship — estimation calls
// (pm_getPaymasterStubData) forward freely. Data calls are capped
// (10/user/day) and each writes a SponsoredTx row (cap counter + spend
// ledger). The daily cap is 429, an open circuit is 503, and an
// unreachable upstream is 502. Senders fall back to user-paid gas on
// 429, 502, and 503.
function findSender(node: any, depth = 0): string | null {
  if (!node || depth > 4 || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const el of node) {
      const hit = findSender(el, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  const sender = (node as any).sender;
  if (typeof sender === "string" && ADDRESS_RE.test(sender)) return sender.toLowerCase();
  for (const v of Object.values(node)) {
    const hit = findSender(v, depth + 1);
    if (hit) return hit;
  }
  return null;
}

export async function POST(req: NextRequest) {
  let raw: string;
  let parsed: any = null;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const method: string | null = parsed?.method ?? null;

  // Resolve the user: session first, sender-mapping fallback.
  let userId: string | undefined;
  let via: "session" | "sender" = "session";
  const session = await getServerSession(authOptions);
  userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    const sender = findSender(parsed?.params);
    if (!sender) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }
    const wallet = await prisma.userWallet.findFirst({
      where: { address: sender },
      select: { userId: true },
    });
    if (!wallet) {
      return NextResponse.json({ error: "unknown sender wallet" }, { status: 403 });
    }
    userId = wallet.userId;
    via = "sender";
  }

  try {
    rateLimit(rateLimitKey(req, "paymaster"), "write");
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: e.message },
        { status: 429, headers: { "Retry-After": String(e.retryAfter) } }
      );
    }
    throw e;
  }

  const paymasterUrl = process.env.CDP_PAYMASTER_URL;
  if (!paymasterUrl) {
    return NextResponse.json({ error: "paymaster not configured" }, { status: 500 });
  }

  const commitsSponsorship = method === "pm_getPaymasterData";
  if (commitsSponsorship) {
    // Pause is enforceable here because sponsorship is a server call.
    // Allowlists and USD caps are enforced by /api/wallet/policy/check before
    // the official client asks CDP to sign. A modified client can still ask
    // the browser SDK to sign a user-paid operation; this proxy cannot see
    // that signature. Unpriced tokens are rejected by the policy check
    // rather than counted as $0.
    const policy = await getPolicy(userId);
    if (policy.pauseAll) {
      return NextResponse.json({ error: "transactions are paused" }, { status: 403 });
    }
    if (!isPaymasterHealthy()) {
      return NextResponse.json({ error: "paymaster unavailable — try again" }, { status: 503 });
    }
    const used = await sponsoredToday(userId);
    if (used >= SPONSOR_CAP_PER_DAY) {
      return NextResponse.json(
        { error: "daily sponsorship limit reached", usedToday: used, cap: SPONSOR_CAP_PER_DAY },
        { status: 429 }
      );
    }
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let upstream: Response;
  let text: string;
  try {
    upstream = await fetch(paymasterUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
      signal: ctrl.signal,
    });
    text = await upstream.text();
  } catch {
    clearTimeout(timer);
    recordPaymasterFailure();
    return NextResponse.json({ error: "paymaster unreachable" }, { status: 502 });
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    recordPaymasterFailure();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  recordPaymasterSuccess();

  if (commitsSponsorship) {
    console.log(`[paymaster] sponsored op for user ${userId} via ${via}`);
    await prisma.sponsoredTx
      .create({ data: { userId, kind: "sponsored-op", status: "pending" } })
      .catch(() => {});
  }

  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
