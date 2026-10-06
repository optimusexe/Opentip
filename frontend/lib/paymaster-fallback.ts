export type SelfPaidReason = "cap" | "paymaster";

type PaymasterError = {
  status?: number;
  statusCode?: number;
  message?: string;
  response?: { status?: number };
};

// The paymaster proxy uses 429 for the daily cap, 502 when the upstream
// paymaster can't be reached, and 503 when the circuit is open. Those are
// the cases where the wallet should pay its own gas. Other errors are not.
export function selfPaidGasReason(error: PaymasterError | null | undefined): SelfPaidReason | null {
  if (!error) return null;
  const code = error.status ?? error.statusCode ?? error.response?.status;
  const msg = String(error.message || "").toLowerCase();
  if (code === 429 || msg.includes("daily sponsorship") || msg.includes("429")) return "cap";
  if (code === 502 || code === 503 || msg.includes("502") || msg.includes("503")) return "paymaster";
  return null;
}
