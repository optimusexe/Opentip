export const SIGNUP_EMAIL_FAILED =
  "Account created, but the verification email failed to send. Sign in and resend the code.";

export const RESEND_EMAIL_FAILED = "verification email failed to send";

export function verificationSendResult(kind: "signup" | "resend", sent: boolean):
  | { ok: true }
  | { ok: false; status: number; error: string; accountCreated?: boolean } {
  if (sent) return { ok: true };
  if (kind === "signup") {
    return { ok: false, status: 502, error: SIGNUP_EMAIL_FAILED, accountCreated: true };
  }
  return { ok: false, status: 502, error: RESEND_EMAIL_FAILED };
}
