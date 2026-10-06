// The indexer inserts a pending row before calling /api/notifications/send.
// That row is not a finished delivery: it still needs one push. Only a row
// that already went out ("sent") or is in flight ("sending") is a duplicate.
export type NotificationSendPlan = "create" | "deliver_existing" | "dedupe";

export function planNotificationSend(
  existing: { status: string } | null | undefined,
): NotificationSendPlan {
  if (!existing) return "create";
  if (existing.status === "pending") return "deliver_existing";
  return "dedupe";
}
