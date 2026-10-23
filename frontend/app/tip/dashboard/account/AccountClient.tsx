"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, StatefulButton } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";
import { GithubIcon } from "@/components/GithubIcon";
import { OtpInput } from "@/components/OtpInput";
import Link from "next/link";

interface AccountStatus {
  hasGithub: boolean;
  hasEmail: boolean;
  hasPassword: boolean;
  email: string | null;
  emailVerified: boolean;
  githubLogin: string | null;
}

export default function AccountClient() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();

  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const [verifyCode, setVerifyCode] = useState("");
  const [verifySending, setVerifySending] = useState(false);
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyCodeSent, setVerifyCodeSent] = useState(false);
  const [verifyError, setVerifyError] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/tip/signin");
    }
  }, [status, router]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/account/status");
      const data = await res.json();
      setAccountStatus(data);
      if (data.emailVerified) {
        setVerifyCodeSent(false);
      }
    } catch {
      showToast({ status: "error", title: "Failed to load account status" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStatus();
    }
  }, [status, fetchStatus]);

  useEffect(() => {
    const linked = params.get("linked");
    const error = params.get("error");
    const verified = params.get("verified");
    if (linked === "github") {
      showToast({ status: "success", title: "GitHub connected" });
      fetchStatus();
      router.replace("/tip/dashboard/account");
    }
    if (verified === "true") {
      showToast({ status: "success", title: "Email verified" });
      fetchStatus();
      router.replace("/tip/dashboard/account");
    }
    if (error) {
      const messages: Record<string, string> = {
        invalid_state: "Invalid OAuth state",
        oauth_failed: "GitHub OAuth failed",
        github_fetch_failed: "Failed to fetch GitHub info",
        github_taken: "This GitHub account is already linked to another user",
        internal: "Something went wrong",
      };
      showToast({ status: "error", title: messages[error] || "Error" });
      router.replace("/tip/dashboard/account");
    }
  }, [params, fetchStatus, router, showToast]);

  async function connectGithub() {
    try {
      const res = await fetch("/api/account/github/link", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast({ status: "error", title: data.error || "Failed to start GitHub linking" });
      }
    } catch {
      showToast({ status: "error", title: "Failed to start GitHub linking" });
    }
  }

  async function saveEmail() {
    if (!email.trim()) return;
    setEmailSaving(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ status: "success", title: "Verification code sent" });
        setEmail("");
        setVerifyCodeSent(true);
        setResendCooldown(60);
        fetchStatus();
      } else {
        showToast({ status: "error", title: data.error || "Failed to save email" });
      }
    } catch {
      showToast({ status: "error", title: "Failed to save email" });
    }
    setEmailSaving(false);
  }

  async function savePassword() {
    setPasswordError(undefined);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      const body: any = { newPassword };
      if (accountStatus?.hasPassword && currentPassword) {
        body.currentPassword = currentPassword;
      }
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ status: "success", title: accountStatus?.hasPassword ? "Password changed" : "Password set" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        fetchStatus();
      } else {
        setPasswordError(data.error);
        showToast({ status: "error", title: data.error || "Failed to save password" });
      }
    } catch {
      setPasswordError("Failed to save password");
      showToast({ status: "error", title: "Failed to save password" });
    }
    setPasswordSaving(false);
  }

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function sendVerifyCode() {
    if (!accountStatus?.email) return;
    setVerifySending(true);
    setVerifyError(undefined);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accountStatus.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyCodeSent(true);
        setResendCooldown(60);
        showToast({ status: "success", title: "Verification code sent" });
      } else {
        setVerifyError(data.error);
        showToast({ status: "error", title: data.error || "Failed to send code" });
      }
    } catch {
      setVerifyError("Failed to send code");
      showToast({ status: "error", title: "Failed to send code" });
    }
    setVerifySending(false);
  }

  async function submitVerifyCode() {
    if (verifyCode.length !== 6) return;
    setVerifySubmitting(true);
    setVerifyError(undefined);
    try {
      const res = await fetch("/api/account/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ status: "success", title: "Email verified" });
        setVerifyCode("");
        setVerifyCodeSent(false);
        fetchStatus();
      } else {
        setVerifyError(data.error);
        showToast({ status: "error", title: data.error || "Invalid code" });
      }
    } catch {
      setVerifyError("Failed to verify code");
      showToast({ status: "error", title: "Failed to verify code" });
    }
    setVerifySubmitting(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="spinner" size={24} />
      </div>
    );
  }

  if (!accountStatus) return null;

  return (
    <div className="max-w-xl space-y-12">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground mt-2">Manage your sign-in options and security.</p>
      </div>

      {/* GitHub */}
      <section className="space-y-4">
        <div className="border-t border-border" />
        <h2 className="text-sm font-medium text-foreground">GitHub</h2>
        {accountStatus.hasGithub ? (
          <div className="flex items-center gap-3">
            <GithubIcon className="h-5 w-5 text-foreground/80" />
            <span className="text-sm text-foreground/80">
              Connected as <span className="font-medium">{accountStatus.githubLogin}</span>
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your GitHub account to register repos and verify ownership.
            </p>
            <Button onClick={connectGithub} size="sm" className="px-4">
              <GithubIcon className="h-4 w-4" /> Connect GitHub
            </Button>
          </div>
        )}
      </section>

      {/* Email */}
      <section className="space-y-4">
        <div className="border-t border-border" />
        <h2 className="text-sm font-medium text-foreground">Email</h2>
        {accountStatus.hasEmail ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/80">{accountStatus.email}</span>
              {accountStatus.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
                  Unverified
                </span>
              )}
            </div>
            {!accountStatus.emailVerified && (
              <div className="space-y-3">
                {!verifyCodeSent ? (
                  <div className="flex items-center gap-3">
                    <Button onClick={sendVerifyCode} size="sm" className="px-4" disabled={verifySending || resendCooldown > 0}>
                      {verifySending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send verification code"}
                    </Button>
                  </div>
                ) : (
                    <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to your email.</p>
                    <div className="flex gap-3 items-end">
                      <div>
                        <OtpInput
                          value={verifyCode}
                          onChange={(v) => { setVerifyCode(v); setVerifyError(undefined); }}
                          disabled={verifySubmitting}
                        />
                        {verifyError && (
                          <p className="px-1 text-xs text-red-400 mt-1.5">{verifyError}</p>
                        )}
                      </div>
                      <div className="flex items-end">
                        <StatefulButton
                          state={verifySubmitting ? "loading" : "idle"}
                          onClick={submitVerifyCode}
                          className="px-4"
                          size="sm"
                          disabled={verifyCode.length !== 6}
                        >
                          Verify
                        </StatefulButton>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={sendVerifyCode}
                      disabled={resendCooldown > 0 || verifySending}
                      className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get it? Resend"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add an email to enable password sign-in and reset.
            </p>
            <div className="flex gap-3">
              <Input
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
              />
              <div className="flex items-end">
                <StatefulButton
                  state={emailSaving ? "loading" : "idle"}
                  onClick={saveEmail}
                  className="px-4"
                  size="sm"
                >
                  Save
                </StatefulButton>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Password */}
      <section className="space-y-4">
        <div className="border-t border-border" />
        <h2 className="text-sm font-medium text-foreground">Password</h2>
        {accountStatus.hasPassword ? (
          <p className="text-sm text-muted-foreground">
            Change your password below.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Set a password to sign in with email.
          </p>
        )}

        <div className="space-y-3">
          {accountStatus.hasPassword && (
            <Input
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="••••••••"
              type="password"
            />
          )}
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
            error={passwordError}
            reserveErrorLine
          />
          <StatefulButton
            state={passwordSaving ? "loading" : "idle"}
            onClick={savePassword}
            className="px-6"
          >
            {accountStatus.hasPassword ? "Change password" : "Set password"}
          </StatefulButton>
        </div>

        {accountStatus.hasPassword && (
          <Link
            href="/tip/forgot-password"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Forgot your password?
          </Link>
        )}
      </section>
    </div>
  );
}
