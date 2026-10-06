import { NextResponse } from "next/server";
import { planNotificationSend } from "@/lib/notification-send";
import {
  claimNotificationDelivery,
  findNotificationByTx,
  markNotificationStatus,
  pushToUser,
  recordNotification,
} from "@/lib/notify";
import { isTrustedNotificationRequest, NOTIFICATION_SECRET_HEADER } from "@/lib/notification-auth";

export async function POST(request: Request) {
  // Trusted server callers only. Checked before any parse, DB write, or push.
  if (!isTrustedNotificationRequest(request.headers.get(NOTIFICATION_SECRET_HEADER))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const { userId, type, title, body: msgBody, txHash, url } = body;
  if (!userId || !type || !title) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const payload = { title, body: msgBody || "", url: url || "/" };

  // The indexer saves the row first, then calls this route with the same hash.
  // A pending row still needs its one push. Sent (or in-flight) rows stay deduped.
  if (txHash) {
    const existing = await findNotificationByTx(userId, type, txHash);
    const plan = planNotificationSend(existing);
    if (plan === "dedupe") return NextResponse.json({ ok: true, deduped: true });
    if (plan === "deliver_existing" && existing) {
      const claimed = await claimNotificationDelivery(existing.id);
      if (!claimed) return NextResponse.json({ ok: true, deduped: true });
      const sent = await pushToUser(userId, payload, { type });
      await markNotificationStatus(existing.id, sent ? "sent" : "pending");
      return NextResponse.json(sent ? { ok: true } : { queued: true });
    }
  }

  const sent = await pushToUser(userId, payload, { type });
  if (!sent) {
    // No subscription (or send failed before any push) — keep a pending row.
    // Distinguish "no subscription" from real failures below via try/catch.
    await recordNotification({ userId, type, title, body: msgBody || "", txHash, status: "pending" });
    return NextResponse.json({ queued: true });
  }
  await recordNotification({ userId, type, title, body: msgBody || "", txHash, status: "sent" });
  return NextResponse.json({ ok: true });
}
