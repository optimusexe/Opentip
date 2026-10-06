import { prisma } from "@/lib/prisma";
import { isExpiredPushError, subscriptionWantsType } from "@/lib/notification-push";
import { sendWebPush } from "@/lib/vapid";

export type PushPayload = { title: string; body: string; url?: string };

// Deliver to every subscription that opted into this type. Expired
// endpoints (404/410) are removed. Returns true if at least one device
// accepted the push. Omit type to send to every device (test pushes).
export async function pushToUser(
  userId: string,
  payload: PushPayload,
  options?: { type?: string },
): Promise<boolean> {
  const subs = await prisma.notificationSubscription.findMany({ where: { userId } });
  let delivered = false;
  for (const sub of subs) {
    if (!sub.endpoint) continue;
    if (options?.type && !subscriptionWantsType(sub.types, options.type)) continue;
    try {
      await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256Key, auth: sub.auth } },
        payload,
      );
      delivered = true;
    } catch (error) {
      if (isExpiredPushError(error)) {
        await prisma.notificationSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
  return delivered;
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
