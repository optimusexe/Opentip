import "dotenv/config";
import { createPublicClient, http, parseAbi } from "viem";
import { base, baseSepolia } from "viem/chains";
import { PrismaClient } from "@prisma/client";
import { formatTokenAmount } from "./formatAmount.js";
import { claimedNotification, notificationDispatch, payoutUpdateFromEvent } from "./events.js";

const prisma = new PrismaClient({ log: ["warn", "error"] }) as PrismaClient & {
  notification?: typeof PrismaClient.prototype.notification;
  notificationSubscription?: typeof PrismaClient.prototype.notificationSubscription;
};

const abi = parseAbi([
  "event RepoRegistered(string repoId, address indexed payoutAddress, uint256 timestamp)",
  "event PayoutAddressUpdated(string repoId, address oldAddress, address indexed newAddress)",
  "event AdminPayoutReassigned(string repoId, address indexed oldAddress, address indexed newAddress, address indexed admin)",
  "event TipReceived(address indexed tipper, string repoId, address indexed token, uint256 amount, uint256 feeAmount, uint256 timestamp)",
  "event Claimed(string repoId, address indexed payoutAddress, address indexed token, uint256 amount, uint256 timestamp)",
  "event TreasuryWithdrawn(address indexed to, address indexed token, uint256 amount, uint256 timestamp)",
  "event TokenAdded(address token, uint8 decimals)",
  "event TokenRemoved(address token)",
]);

const chain = process.env.CHAIN === "base" ? base : baseSepolia;
const rpcUrl = process.env.RPC_URL || "";
const contractAddress = process.env.CONTRACT_ADDRESS as `0x${string}`;
const pollMs = Number(process.env.POLL_MS || 12000);
const startBlockEnv = process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : undefined;

if (!contractAddress) throw new Error("CONTRACT_ADDRESS env required");

const client = createPublicClient({ chain, transport: http(rpcUrl) });

async function getFromBlock(): Promise<bigint> {
  const state = await prisma.indexerState.findUnique({ where: { id: "singleton" } });
  if (state) return state.last_block + 1n;
  if (startBlockEnv !== undefined) return startBlockEnv;
  // fallback: last 10k blocks
  const latest = await client.getBlockNumber();
  return latest > 10000n ? latest - 10000n : 0n;
}

const MAX_RANGE = BigInt(process.env.GETLOGS_RANGE || "10"); // Alchemy free tier: max 10 blocks

async function getLogsBatched(fromBlock: bigint, toBlock: bigint) {
  const all: any[] = [];
  let cur = fromBlock;
  while (cur <= toBlock) {
    const end = cur + MAX_RANGE - 1n > toBlock ? toBlock : cur + MAX_RANGE - 1n;
    const chunk = await client.getLogs({
      address: contractAddress,
      events: abi,
      fromBlock: cur,
      toBlock: end,
    });
    all.push(...chunk);
    cur = end + 1n;
  }
  return all;
}

async function withDbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const isP1001 = e?.code === "P1001" || String(e?.message || "").includes("Can't reach database server");
      if (isP1001 && i < retries - 1) {
        const delay = Math.min(2000 * Math.pow(2, i), 16000);
        console.warn(`[indexer] DB unreachable, retry ${i + 1}/${retries} in ${delay}ms...`);
        try { await prisma.$disconnect(); } catch {}
        await new Promise((r) => setTimeout(r, delay));
        try { await prisma.$connect(); } catch {}
        continue;
      }
      throw e;
    }
  }
  throw new Error("unreachable");
}

async function findUserIdByAddress(address: string): Promise<string | null> {
  const wallet = await prisma.userWallet.findUnique({
    where: { address: address.toLowerCase() },
    select: { userId: true },
  });
  return wallet?.userId ?? null;
}

async function notifyUser(userId: string, type: string, title: string, body: string, txHash?: string): Promise<void> {
  try {
    // Idempotency: retries/replays must not duplicate rows or push twice.
    // A pending row was saved before the push completed, so still call the app.
    if (txHash) {
      const dup = await prisma.notification.findFirst({ where: { userId, type, txHash } });
      const dispatch = notificationDispatch(dup);
      if (dispatch === "skip") return;
      if (dispatch === "create") {
        await prisma.notification.create({
          data: { userId, type, title, body, txHash, status: "pending" },
        });
      }
    } else {
      await prisma.notification.create({
        data: { userId, type, title, body, txHash: null, status: "pending" },
      });
    }
    const endpoint = process.env.NOTIFICATION_API_URL || "https://opentip.tech/api/notifications/send";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.NOTIFICATION_SECRET) {
      headers["x-notification-secret"] = process.env.NOTIFICATION_SECRET;
    }
    await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ userId, type, title, body: body, txHash }),
    }).catch(() => {});
  } catch { /* non-critical */ }
}

async function tick() {
  const fromBlock = await withDbRetry(() => getFromBlock());
  const toBlock = await client.getBlockNumber();
  if (fromBlock > toBlock) return;

  const logs = await getLogsBatched(fromBlock, toBlock);

  for (const log of logs) {
    // @ts-ignore viem union
    const eventName = log.eventName as string;
    const args: any = log.args;
    if (eventName === "TipReceived") {
      // deterministic id = tx_hash + logIndex to make replays idempotent
      const id = `${log.transactionHash}_${log.logIndex ?? 0}`;
      const tokenAddress = args.token || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // default to USDC for v1 compat
      await withDbRetry(() =>
        prisma.tip.upsert({
          where: { id },
          create: {
            id,
            tipper_address: args.tipper.toLowerCase(),
            repo_id: args.repoId,
            token: tokenAddress.toLowerCase(),
            amount: args.amount.toString(),
            fee_amount: args.feeAmount.toString(),
            timestamp: new Date(Number(args.timestamp) * 1000),
            tx_hash: log.transactionHash!,
            block_number: log.blockNumber!,
          },
          update: {},
        })
      );
      const repo = await withDbRetry(() => prisma.repo.findUnique({ where: { repo_id: args.repoId }, select: { payout_address: true } }));
      if (repo) {
        const ownerId = await findUserIdByAddress(repo.payout_address);
        if (ownerId) {
          const tipAmt = formatTokenAmount(args.amount.toString(), tokenAddress);
          await notifyUser(
            ownerId,
            "tip_received",
            "New tip received",
            tipAmt
              ? `You received a tip of ${tipAmt} on your repo ${args.repoId}`
              : `You received a tip on your repo ${args.repoId}`,
            log.transactionHash!,
          );
        }
      }
    } else if (eventName === "RepoRegistered") {
      await withDbRetry(() =>
        prisma.repo.upsert({
          where: { repo_id: args.repoId },
          create: { repo_id: args.repoId, payout_address: args.payoutAddress.toLowerCase(), registered_at: new Date(Number(args.timestamp) * 1000) },
          update: { payout_address: args.payoutAddress.toLowerCase() },
        })
      );
    } else if (eventName === "PayoutAddressUpdated" || eventName === "AdminPayoutReassigned") {
      const payoutUpdate = payoutUpdateFromEvent(eventName, args);
      if (payoutUpdate) {
        await withDbRetry(() =>
          prisma.repo.update({ where: { repo_id: payoutUpdate.repoId }, data: { payout_address: payoutUpdate.payoutAddress } }).catch(() => null as any)
        );
      }
    } else if (eventName === "Claimed") {
      // Store claims so wallet history shows them even without an explorer key.
      // Deterministic id = tx_hash + logIndex to make replays idempotent.
      const id = `${log.transactionHash}_${log.logIndex ?? 0}`;
      await withDbRetry(() =>
        prisma.claim.upsert({
          where: { id },
          create: {
            id,
            repo_id: args.repoId,
            payout_address: args.payoutAddress.toLowerCase(),
            token: args.token.toLowerCase(),
            amount: args.amount.toString(),
            timestamp: new Date(Number(args.timestamp) * 1000),
            tx_hash: log.transactionHash!,
            block_number: log.blockNumber!,
          },
          update: {},
        })
      );
      const claimerId = await findUserIdByAddress(args.payoutAddress.toLowerCase());
      if (claimerId) {
        const claimAmt = formatTokenAmount(args.amount.toString(), args.token);
        const notice = claimedNotification(args.repoId, claimAmt);
        await notifyUser(
          claimerId,
          "claim_available",
          notice.title,
          notice.body,
          log.transactionHash!,
        );
      }
    }
    // TreasuryWithdrawn / TokenAdded / TokenRemoved only need checkpoint
  }

  await withDbRetry(() =>
    prisma.indexerState.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", last_block: toBlock },
      update: { last_block: toBlock },
    })
  );

  if (logs.length) console.log(`[indexer] ${logs.length} events [${fromBlock}..${toBlock}]`);
}

let running = true;

function shutdown() {
  console.log("[indexer] shutting down...");
  running = false;
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function main() {
  console.log(`[indexer] chain ${chain.id} contract ${contractAddress} rpc ${rpcUrl}`);
  // ensure state row exists
  while (running) {
    try { await tick(); } catch (e) { console.error("[indexer] tick error", e); }
    if (!running) break;
    await new Promise((r) => setTimeout(r, pollMs));
  }
  await prisma.$disconnect();
  process.exit(0);
}

main();
