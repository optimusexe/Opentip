"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/motion/input";
import { StatefulButton } from "@/components/motion/button";
import { useToast } from "@/app/providers";
import Link from "next/link";

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto space-y-10">
          <h1 className="font-display text-4xl tracking-tight">Invalid link</h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <div className="border-t border-border pt-6">
            <Link href="/tip/forgot-password" className="text-sm text-muted-foreground underline underline-offset-4">Request a new link</Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto space-y-10">
          <h1 className="font-display text-4xl tracking-tight">Password reset</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been reset. You can now sign in with your new password.
          </p>
          <div className="border-t border-border pt-6">
            <Link href="/tip/signin" className="text-sm text-muted-foreground underline underline-offset-4">Sign in →</Link>
          </div>
        </div>
      </div>
    );
  }

  async function resetPassword() {
    setError(undefined);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error);
        showToast({ status: "error", title: data.error || "Failed to reset password" });
      }
    } catch {
      setError("Failed to reset password");
      showToast({ status: "error", title: "Failed to reset password" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="max-w-sm w-full mx-auto space-y-10">
        <h1 className="font-display text-4xl tracking-tight">New password</h1>

        <div className="space-y-4">
          <Input
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="••••••••"
            type="password"
          />
          <Input
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            type="password"
            error={error}
            reserveErrorLine
          />
          <StatefulButton
            state={loading ? "loading" : "idle"}
            onClick={resetPassword}
            className="px-6"
          >
            Reset password
          </StatefulButton>
        </div>

        <div className="border-t border-border pt-6">
          <Link href="/tip/signin" className="text-sm text-muted-foreground underline underline-offset-4">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
