// Prefix a same-origin path so it lands on the tipping site. Marketing
// paths and API routes stay where they are. Query and hash are kept.
export function toTipPath(path: string, fallback = "/tip"): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }
  const query = path.indexOf("?");
  const hash = path.indexOf("#");
  const cuts = [query, hash].filter((index) => index >= 0);
  const cut = cuts.length > 0 ? Math.min(...cuts) : path.length;
  const pathname = path.slice(0, cut);
  const suffix = path.slice(cut);
  if (
    pathname === "/tip"
    || pathname.startsWith("/tip/")
    || pathname === "/api"
    || pathname.startsWith("/api/")
    || pathname === "/beta"
    || pathname.startsWith("/beta/")
    || pathname === "/terms"
    || pathname === "/privacy"
    || pathname === "/subprocessors"
    || pathname.startsWith("/subprocessors/")
  ) {
    return path;
  }
  if (pathname === "/") return `/tip${suffix}`;
  return `/tip${pathname}${suffix}`;
}
