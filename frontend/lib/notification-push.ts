// Applied when a subscription is created with no saved choice. An explicit
// empty list, saved later from the dashboard, still means send nothing.
export const DEFAULT_NOTIFICATION_TYPES = [
  "tip_received",
  "claim_available",
  "tip_sent",
  "claim_submitted",
] as const;

function asTypeList(types: unknown): string[] | null {
  if (!Array.isArray(types)) return null;
  return types.filter((entry): entry is string => typeof entry === "string");
}

// First device with no list gets the defaults. A missing or empty payload
// is not a choice. Another device of the same user inherits the saved list,
// including an explicit empty one.
export function typesForNewSubscription(options: {
  provided?: unknown;
  existing?: unknown;
  hasExisting: boolean;
}): string[] {
  if (options.hasExisting) {
    return asTypeList(options.existing) ?? [...DEFAULT_NOTIFICATION_TYPES];
  }
  const provided = asTypeList(options.provided);
  if (provided && provided.length > 0) return provided;
  return [...DEFAULT_NOTIFICATION_TYPES];
}

// Checkboxes before the first subscribe show the defaults. After that, the
// stored list is shown, and an empty list stays empty.
export function displayedNotificationTypes(types: unknown, hasSubscription: boolean): string[] {
  if (!hasSubscription) return [...DEFAULT_NOTIFICATION_TYPES];
  return asTypeList(types) ?? [...DEFAULT_NOTIFICATION_TYPES];
}

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
