export type WalletWriteKind = "approve" | "tip" | "claim" | "register";

type WalletWriteError = {
  message?: string;
  shortMessage?: string;
  name?: string;
};

// Wallet prompts that the user cancels never get a transaction hash, so the
// receipt watcher never fires. Those errors have to reset the button themselves.
export function isUserRejectedWrite(error: WalletWriteError | null | undefined): boolean {
  if (!error) return false;
  const text = `${error.name ?? ""} ${error.shortMessage ?? ""} ${error.message ?? ""}`.toLowerCase();
  const compact = text.replace(/[\s_-]+/g, "");
  return (
    text.includes("user rejected") ||
    text.includes("user denied") ||
    text.includes("rejected the request") ||
    text.includes("denied transaction") ||
    compact.includes("userrejected") ||
    compact.includes("userdenied")
  );
}

export function walletWriteToast(
  kind: WalletWriteKind,
  error: WalletWriteError,
): { title: string; description: string } {
  const description = (error.shortMessage || error.message || "The wallet did not send the transaction.").slice(0, 120);
  if (isUserRejectedWrite(error)) return { title: "Transaction rejected", description };
  const title =
    kind === "approve" ? "Approve failed"
    : kind === "tip" ? "Tip failed"
    : kind === "claim" ? "Claim failed"
    : "Register failed";
  return { title, description };
}
