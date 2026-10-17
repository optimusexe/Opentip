export type SelfPaidReason = "cap" | "paymaster";

export const selfPaidCapStatuses = [429] as const;
export const selfPaidPaymasterStatuses = [502, 503] as const;

type PaymasterError = {
  status?: number;
  statusCode?: number;
  message?: string;
  response?: { status?: number };
};

// The paymaster proxy uses 429 for the daily cap, 502 when the upstream
// paymaster can't be reached, and 503 when the circuit is open. Those are
// the cases where the wallet should pay its own gas. Other errors are not.
function listed(code: number | undefined, statuses: readonly number[]) {
  return code != null && statuses.includes(code);
}

export function selfPaidGasReason(error: PaymasterError | null | undefined): SelfPaidReason | null {
  if (!error) return null;
  const code = error.status ?? error.statusCode ?? error.response?.status;
  const msg = String(error.message || "").toLowerCase();
  if (listed(code, selfPaidCapStatuses) || msg.includes("daily sponsorship") || msg.includes("429")) return "cap";
  if (listed(code, selfPaidPaymasterStatuses) || msg.includes("502") || msg.includes("503")) return "paymaster";
  return null;
}
