// A subscription only receives the types the user checked. An empty list
// means none, not all.
export function subscriptionWantsType(types: unknown, type: string): boolean {
  return Array.isArray(types) && types.some((entry) => entry === type);
}

// Web Push uses 404 and 410 when a subscription is gone or expired.
export function isExpiredPushError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { statusCode?: unknown; status?: unknown }).statusCode
    ?? (error as { status?: unknown }).status;
  return code === 404 || code === 410;
}
