// GitHub's repository permission values. `maintain` is the org-repo role
// between write and admin; `push` is the older alias for write.
const REGISTER_PERMISSIONS = new Set(["admin", "maintain", "write", "push"]);

export function permissionAllowsRegister(permission: unknown): boolean {
  return typeof permission === "string" && REGISTER_PERMISSIONS.has(permission.toLowerCase());
}

// Email-only sessions are signed in, but registration needs a GitHub login.
export function ownershipAuthError(
  session: { user?: { id?: string | null; login?: string | null } } | null | undefined,
): string | null {
  if (!session?.user?.id) return "not authenticated";
  if (!session.user.login) return "Connect GitHub to verify ownership";
  return null;
}

// The caller's OAuth token is tried first. The server token is only a
// fallback when the user token is missing or the request itself fails.
export function githubAuthTokens(
  userToken: string | null | undefined,
  serverToken: string | null | undefined,
): string[] {
  const tokens: string[] = [];
  const user = userToken?.trim();
  const server = serverToken?.trim();
  if (user) tokens.push(user);
  if (server && server !== user) tokens.push(server);
  return tokens;
}
