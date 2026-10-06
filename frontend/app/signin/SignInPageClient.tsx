"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/motion/input";
import { Button, StatefulButton } from "@/components/motion/button";
import { useToast } from "@/app/providers";
import { GithubIcon } from "@/components/GithubIcon";
import Link from "next/link";

export default function SignInPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const safeCallbackUrl = callbackUrl.startsWith("/") && !callbackUrl.includes("://") ? callbackUrl : "/dashboard";
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>(undefined);

  const onGithub = () => {
    const callbackUrl = safeCallbackUrl.startsWith("/onboarding")
      ? safeCallbackUrl
      : `/onboarding?next=${encodeURIComponent(safeCallbackUrl)}`;
    signIn("github", { callbackUrl });
  };
  const onEmail = async () => {
    setError(undefined);
    if (mode==="signup" && password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (mode==="signup") {
      setLoading(true);
      const res = await fetch("/api/auth/signup", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ email, password, name })});
      const j = await res.json();
      if (!res.ok && !j.accountCreated) { setError(j.error); setLoading(false); showToast({ status:"error", title: j.error }); return; }
      if (!res.ok && j.accountCreated) {
        setError(j.error);
        showToast({ status:"error", title: j.error || "verification email failed to send" });
      } else {
        showToast({ status:"success", title:"Account created, signing in..." });
      }
      const r = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/verify-email" });
      setLoading(false);
      if (r?.error) { setError("Invalid email or password"); showToast({ status:"error", title: "Login failed" }); }
      else if (r?.ok) router.push("/verify-email");
      return;
    }
    setLoading(true);
    const r = await signIn("credentials", { email, password, redirect: false, callbackUrl: safeCallbackUrl });
    setLoading(false);
    if (r?.error) { setError("Invalid email or password"); showToast({ status:"error", title: "Login failed" }); }
    else if (r?.ok) router.push(safeCallbackUrl);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="max-w-sm w-full mx-auto space-y-10">
        <h1 className="serif fluid-display font-semibold tracking-tight leading-[0.9]">Sign in</h1>

        <div className="space-y-3">
          <Button onClick={onGithub} size="lg" className="w-full px-6">
            <GithubIcon className="h-5 w-5" /> Continue with GitHub
          </Button>
        </div>

        <div className="border-t rule" />

        <div className="space-y-4">
          <div className="space-y-3">
            {mode === "signup" && <Input label="Name" value={name} onChange={setName} placeholder="Ada Lovelace" />}
            <Input label="Email" value={email} onChange={setEmail} placeholder="ada@example.com" type="email" />
            <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" error={error} reserveErrorLine />
          </div>

          {mode === "login" && (
            <Link href="/forgot-password" className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-700">
              Forgot your password?
            </Link>
          )}

          <StatefulButton state={loading ? "loading" : "idle"} onClick={onEmail} className="px-6">
            {mode === "signup" ? "Create account" : "Sign in"}
          </StatefulButton>

          <p className="text-xs text-zinc-500">
            {mode === "login" ? (
              <>Don&apos;t have an account? <button onClick={() => setMode("signup")} className="underline underline-offset-4 text-zinc-700 hover:text-zinc-900">Create one</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode("login")} className="underline underline-offset-4 text-zinc-700 hover:text-zinc-900">Sign in</button></>
            )}
          </p>
        </div>

        <div className="border-t rule pt-6">
          <Link href="/" className="text-sm text-zinc-600 underline underline-offset-4">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
