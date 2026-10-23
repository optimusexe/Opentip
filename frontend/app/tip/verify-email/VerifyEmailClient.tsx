"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/OtpInput";
import { StatefulButton } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";

export default function VerifyEmailClient() {
  const { status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState<string | null>(null);
  const [fetchingEmail, setFetchingEmail] = useState(true);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/tip/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/account/status")
      .then((r) => r.json())
      .then((data) => {
        setEmail(data.email);
        if (data.emailVerified) {
          router.replace("/tip/onboarding");
          return;
        }
      })
      .catch(() => {})
      .finally(() => setFetchingEmail(false));
  }, [status, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function sendCode() {
    if (!email) return;
    setSending(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendCooldown(60);
        showToast({ status: "success", title: "Verification code sent" });
      } else {
        showToast({ status: "error", title: data.error || "Failed to send code" });
      }
    } catch {
      showToast({ status: "error", title: "Failed to send code" });
    }
    setSending(false);
  }

  async function verifyCode() {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ status: "success", title: "Email verified" });
        router.push("/tip/onboarding");
      } else {
        showToast({ status: "error", title: data.error || "Invalid code" });
      }
    } catch {
      showToast({ status: "error", title: "Failed to verify code" });
    }
    setSubmitting(false);
  }

  if (status === "loading" || fetchingEmail) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto space-y-10">
          <Loader variant="spinner" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="max-w-sm w-full mx-auto space-y-10">
        <h1 className="font-display text-4xl tracking-tight">Verify your email</h1>

        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to <span className="font-medium">{email}</span>.
        </p>
        <div className="space-y-4">
          <OtpInput
            value={code}
            onChange={(v) => { setCode(v); }}
            disabled={submitting}
          />
          <StatefulButton
            state={submitting ? "loading" : "idle"}
            onClick={verifyCode}
            className="px-6"
            disabled={code.length !== 6}
          >
            Verify
          </StatefulButton>
          <button
            type="button"
            onClick={sendCode}
            disabled={resendCooldown > 0 || sending}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get it? Resend"}
          </button>
        </div>


      </div>
    </div>
  );
}
