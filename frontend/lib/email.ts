import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  if (!resend) resend = new Resend(key);
  return resend;
}

export async function sendVerificationEmail(email: string, code: string) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM || "noreply@opentip.tech",
    to: email,
    subject: "Verify your email | Opentip Tip",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #c1c0b6; padding: 40px 20px; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto;">
          <div style="margin-bottom: 32px; text-align: center;">
            <a href="https://opentip.tech/tip" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
              <img src="https://opentip.tech/Opentip.png" alt="" width="28" height="28" style="display: block;" />
              <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 600; color: #09090b;">Opentip Tip</span>
            </a>
          </div>
          <div style="border-top: 1px solid rgba(0,0,0,0.12); padding-top: 32px;">
            <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 600; color: #09090b; margin: 0 0 24px; line-height: 1.2;">Verify your email</h1>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 24px;">
              Enter this code to verify your email address. It expires in 1 hour.
            </p>
            <div style="background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; padding: 20px; text-align: center; margin: 0 0 24px;">
              <span style="font-family: 'SF Mono', SFMono-Regular, ui-monospace, Menlo, monospace; font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #09090b;">${code}</span>
            </div>
          </div>
          <div style="border-top: 1px solid rgba(0,0,0,0.12); margin-top: 32px; padding-top: 24px;">
            <p style="font-size: 12px; color: #71717a; line-height: 1.6; margin: 0 0 8px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="font-size: 11px; color: #a1a1aa; line-height: 1.6; margin: 0;">
              Opentip Tip · <a href="https://opentip.tech/tip" style="color: #a1a1aa; text-decoration: underline;">opentip.tech/tip</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || "https://opentip.tech"}/tip/reset-password?token=${token}`;

  await getResend().emails.send({
    from: process.env.RESEND_FROM || "noreply@opentip.tech",
    to: email,
    subject: "Reset your password | Opentip Tip",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #c1c0b6; padding: 40px 20px; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto;">
          <div style="margin-bottom: 32px; text-align: center;">
            <a href="https://opentip.tech/tip" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
              <img src="https://opentip.tech/Opentip.png" alt="" width="28" height="28" style="display: block;" />
              <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 600; color: #09090b;">Opentip Tip</span>
            </a>
          </div>
          <div style="border-top: 1px solid rgba(0,0,0,0.12); padding-top: 32px;">
            <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 600; color: #09090b; margin: 0 0 24px; line-height: 1.2;">Reset your password</h1>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 24px;">
              Click the button below to reset your password. This link expires in 1 hour.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background: #1f21b6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 2px; font-size: 14px; font-weight: 500;">
              Reset password
            </a>
          </div>
          <div style="border-top: 1px solid rgba(0,0,0,0.12); margin-top: 32px; padding-top: 24px;">
            <p style="font-size: 12px; color: #71717a; line-height: 1.6; margin: 0 0 8px;">
              If you didn't request this, you can safely ignore this email. Your password won't change unless you click the link above.
            </p>
            <p style="font-size: 11px; color: #a1a1aa; line-height: 1.6; margin: 0;">
              Opentip Tip · <a href="https://opentip.tech/tip" style="color: #a1a1aa; text-decoration: underline;">opentip.tech/tip</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
