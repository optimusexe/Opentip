import { prisma } from "@/lib/prisma";
import { sendWebPush } from "@/lib/vapid";

export type PushPayload = { title: string; body: string; url?: string };

// Look up the user's push subscription and deliver. Returns true on success.
export async function pushToUser(userId: string, payload: PushPayload): Promise<boolean> {
  const sub = await prisma.notificationSubscription.findFirst({ where: { userId } });
  if (!sub?.endpoint) return false;
  try {
    await sendWebPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256Key, auth: sub.auth } },
      payload,
    );
    return true;
  } catch {
    return false;
  }
}

// Idempotency guard: same user + type + txHash must never create twice
// (indexer retries/replays would otherwise duplicate rows).
export async function findNotificationByTx(userId: string, type: string, txHash: string) {
  return prisma.notification.findFirst({ where: { userId, type, txHash } });
}

// Move pending → sending so overlapping callers cannot both push.
export async function claimNotificationDelivery(id: string): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id, status: "pending" },
    data: { status: "sending" },
  });
  return result.count === 1;
}

export async function markNotificationStatus(id: string, status: string) {
  return prisma.notification.update({ where: { id }, data: { status } });
}

export async function recordNotification(data: {
  userId: string;
  type: string;
  title: string;
  body: string;
  txHash?: string | null;
  status?: string;
  ref?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      txHash: data.txHash ?? null,
      status: data.status ?? "pending",
      ref: data.ref ?? null,
    },
  });
}
