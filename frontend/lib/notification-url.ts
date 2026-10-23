// Same-origin target for notification clicks. Anything else opens Opentip Tip.
// public/sw.js is a classic worker and inlines this function.
// Keep the two copies in sync.
const TIP_HOME = "/tip";

export function sameOriginNotificationUrl(raw: unknown, origin: string): string {
  let base: URL;
  try {
    base = new URL(origin);
  } catch {
    return TIP_HOME;
  }
  const fallback = new URL(TIP_HOME, base).href;
  try {
    const input = typeof raw === "string" && raw.trim() ? raw : TIP_HOME;
    const url = new URL(input, base);
    if (url.origin !== base.origin) return fallback;
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return url.href;
  } catch {
    return fallback;
  }
}
