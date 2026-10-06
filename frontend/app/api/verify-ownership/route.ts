import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signTypedData } from "viem/accounts";
import { randomBytes } from "crypto";
import { CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/chain";
import { prisma } from "@/lib/prisma";
import { generateRepoSummary } from "@/lib/ai";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { checkPayoutCanReceiveEth } from "@/lib/payout-eth";
import { githubAuthTokens, ownershipAuthError, permissionAllowsRegister } from "@/lib/github-permission";
import {
  classifyGithubRepoStatus,
  githubRepoFailure,
  githubRetryAfterSeconds,
  repoLookupCredentials,
  shouldFallbackUnauthenticated,
  type GithubRepoAttempt,
} from "@/lib/github-repo-lookup";

export async function POST(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "verify-ownership"), "critical"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }

  try {
    const body = await req.json();
    const { repoId: repoIdRaw, payoutAddress } = body;
    if (!repoIdRaw || typeof repoIdRaw !== "string") {
      return NextResponse.json({ error: "repoId required as owner/repo" }, { status: 400 });
    }
    const repoId = repoIdRaw.toLowerCase();

    if (!repoId.includes("/")) {
      return NextResponse.json({ error: "repoId required as owner/repo" }, { status: 400 });
    }
    const [owner, repo] = repoId.split("/");
    if (!owner || !repo || !/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
      return NextResponse.json({ error: "invalid repoId format" }, { status: 400 });
    }
    if (
      !payoutAddress ||
      typeof payoutAddress !== "string" ||
      !/^0x[0-9a-fA-F]{40}$/.test(payoutAddress) ||
      payoutAddress === "0x0000000000000000000000000000000000000000"
    ) {
      return NextResponse.json({ error: "valid payoutAddress required" }, { status: 400 });
    }

    const session: any = await getServerSession(authOptions);
    const authError = ownershipAuthError(session);
    if (authError) {
      const status = authError === "not authenticated" ? 401 : 403;
      return NextResponse.json({ error: authError }, { status });
    }
    const login = session.user.login as string;

    // Authenticated lookup first. An unauthenticated call shares GitHub's
    // 60/hour budget, and that 403 used to be reported as "repo not found".
    const repoJson = await lookupGithubRepo(owner, repo, (session as any)?.accessToken, process.env.GITHUB_TOKEN);
    if (!repoJson.ok) {
      return NextResponse.json(
        { error: repoJson.error },
        {
          status: repoJson.status,
          headers: repoJson.status === 429 ? { "Retry-After": String(repoJson.retryAfter) } : undefined,
        },
      );
    }

    let owns = false;

    // owner check
    if (repoJson.repo.owner?.login?.toLowerCase() === login.toLowerCase()) {
      owns = true;
    }

    // Maintainer / collaborator check. The user's OAuth token is tried
    // first so org permissions are evaluated as that user. A non-OK response
    // falls through to the server token; a definitive answer does not.
    if (!owns) {
      const tokens = githubAuthTokens((session as any)?.accessToken, process.env.GITHUB_TOKEN);
      for (const token of tokens) {
        const collabRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators/${encodeURIComponent(login)}/permission`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
        });
        if (!collabRes.ok) continue;
        const j: any = await collabRes.json();
        owns = permissionAllowsRegister(j.permission);
        break;
      }
    }

    if (!owns) return NextResponse.json({ error: "not repo owner, maintainer, or collaborator" }, { status: 403 });

    const payoutCheck = await checkPayoutCanReceiveEth(payoutAddress as `0x${string}`);
    if (!payoutCheck.ok) {
      return NextResponse.json({ error: payoutCheck.reason }, { status: 400 });
    }

    // Generate nonce and expiry
    const nonce = randomBytes(16).readBigUInt64BE(0);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 minutes

    // Sign EIP-712 locally with registrar key (no RPC needed)
    const pk = process.env.REGISTRAR_PRIVATE_KEY;
    if (!pk) throw new Error("REGISTRAR_PRIVATE_KEY env var not set");

    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured");

    const signature = await signTypedData({
      privateKey: pk as `0x${string}`,
      domain: {
        name: "Opentip",
        version: "2",
        chainId: BigInt(CHAIN_ID),
        verifyingContract: CONTRACT_ADDRESS!,
      },
      types: {
        Register: [
          { name: "repoId", type: "string" },
          { name: "payoutAddress", type: "address" },
          { name: "expiry", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      },
      primaryType: "Register",
      message: {
        repoId,
        payoutAddress: payoutAddress as `0x${string}`,
        expiry,
        nonce,
      },
    });

    // Derive signer address from private key
    const { privateKeyToAccount } = await import("viem/accounts");
    const account = privateKeyToAccount(pk as `0x${string}`);

    // Generate AI summary in background (non-blocking)
    generateRepoSummary(owner, repo).then(async (summary) => {
      try {
        await prisma.repo.upsert({
          where: { repo_id: repoId },
          update: {
            summary: JSON.stringify(summary),
            summary_generated_at: new Date(),
          },
          create: {
            repo_id: repoId,
            payout_address: payoutAddress,
            registered_at: new Date(),
            summary: JSON.stringify(summary),
            summary_generated_at: new Date(),
          },
        });
      } catch (e) {
        console.error("Failed to store summary after registration:", e);
      }
    }).catch((e) => {
      console.error("Summary generation failed:", e);
    });

    return NextResponse.json({
      ok: true,
      signature,
      expiry: expiry.toString(),
      nonce: nonce.toString(),
      signer: account.address,
    });
  } catch (e: any) {
    console.error("verify-ownership error:", e?.message);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

type RepoLookup =
  | { ok: true; repo: { owner?: { login?: string } } }
  | { ok: false; error: string; status: number; retryAfter: number };

async function readGithubRepo(owner: string, repo: string, token: string | null): Promise<{
  attempt: GithubRepoAttempt;
  retryAfter: number;
  repo?: { owner?: { login?: string } };
}> {
  const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  const retryAfter = githubRetryAfterSeconds(res.headers.get("x-ratelimit-reset"));
  let message = "";
  let body: { owner?: { login?: string }; message?: string } | null = null;
  try {
    body = await res.json();
    message = typeof body?.message === "string" ? body.message : "";
  } catch {
    message = "";
  }
  const attempt = classifyGithubRepoStatus(res.status, res.headers.get("x-ratelimit-remaining"), message);
  if (attempt === "ok" && body) return { attempt, retryAfter, repo: body };
  return { attempt, retryAfter };
}

async function lookupGithubRepo(
  owner: string,
  repo: string,
  userToken: string | null | undefined,
  serverToken: string | null | undefined,
): Promise<RepoLookup> {
  const credentials = repoLookupCredentials(userToken, serverToken);
  const attempts: GithubRepoAttempt[] = [];
  let retryAfter = 60;
  for (const token of credentials) {
    const result = await readGithubRepo(owner, repo, token);
    attempts.push(result.attempt);
    if (result.attempt === "rate_limited") retryAfter = result.retryAfter;
    if (result.attempt === "ok" && result.repo) return { ok: true, repo: result.repo };
  }
  if (credentials.some((token) => token) && shouldFallbackUnauthenticated(attempts)) {
    const result = await readGithubRepo(owner, repo, null);
    attempts.push(result.attempt);
    if (result.attempt === "rate_limited") retryAfter = result.retryAfter;
    if (result.attempt === "ok" && result.repo) return { ok: true, repo: result.repo };
  }
  const failure = githubRepoFailure(attempts, retryAfter);
  return { ok: false, error: failure.error, status: failure.status, retryAfter };
}
