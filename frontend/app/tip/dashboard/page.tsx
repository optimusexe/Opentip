"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";

export default function DashboardProfile() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [pfp, setPfp] = useState<string | null>(null);
  const [header, setHeader] = useState<string | null>(null);
  const [uploadingPfp, setUploadingPfp] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);

  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [discord, setDiscord] = useState("");
  const [telegram, setTelegram] = useState("");
  const [farcaster, setFarcaster] = useState("");
  const [github, setGithub] = useState("");

  const pfpInput = useRef<HTMLInputElement>(null);
  const headerInput = useRef<HTMLInputElement>(null);

  const login = (session?.user as any)?.login as string | undefined;

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/account/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pfp) setPfp(data.pfp);
        if (data.header) setHeader(data.header);
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !login) { setLoading(false); return; }
    fetch(`/api/dev/${login}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        if (data.pfp) setPfp(data.pfp);
        if (data.header) setHeader(data.header);
        if (data.bio) setBio(data.bio);
        if (data.social?.website) setWebsite(data.social.website);
        if (data.social?.twitter) setTwitter(data.social.twitter);
        if (data.social?.discord) setDiscord(data.social.discord);
        if (data.social?.telegram) setTelegram(data.social.telegram);
        if (data.social?.farcaster) setFarcaster(data.social.farcaster);
        if (data.social?.github) setGithub(data.social.github);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, login]);

  async function uploadFile(file: File, type: "pfp" | "header") {
    const setter = type === "pfp" ? setUploadingPfp : setUploadingHeader;
    setter(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/upload/${type}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (type === "pfp") setPfp(data.url);
        else setHeader(data.url);
        showToast({ status: "success", title: type === "pfp" ? "Profile picture updated" : "Header updated" });
      } else {
        showToast({ status: "error", title: data.error || "Upload failed" });
      }
    } catch {
      showToast({ status: "error", title: "Upload failed" });
    }
    setter(false);
  }

  function handlePfpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "pfp");
  }

  function handleHeaderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "header");
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/dev/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, website, twitter, discord, telegram, farcaster, github }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("Profile saved.");
      } else {
        setMessage(data.error || "Failed to save.");
      }
    } catch (e: any) {
      setMessage(e.message || "Failed to save.");
    }
    setSaving(false);
  }

  if (status === "loading" || loading) {
    return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;
  }

  if (status === "unauthenticated") return null;

  const fallbackName = session?.user?.name || session?.user?.email || "U";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {login
            ? <>Shown on <span className="font-mono text-xs">/tip/dev/{login}</span>.</>
            : "Link GitHub to get a public profile at /tip/dev/{username}"}
        </p>
      </div>

      <input ref={pfpInput} type="file" accept="image/*" className="hidden" onChange={handlePfpChange} />
      <input ref={headerInput} type="file" accept="image/*" className="hidden" onChange={handleHeaderChange} />

      <section className="rounded-[10px] border border-border p-4">
        <h2 className="text-sm font-medium">Header</h2>
        <div
          className="relative mt-3 h-32 w-full cursor-pointer overflow-hidden rounded-[10px] border border-border group"
          onClick={() => headerInput.current?.click()}
        >
          {header ? (
            <Image src={header} alt="Header" width={800} height={192} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              {uploadingHeader ? "Uploading..." : "Click to upload header image"}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
            {uploadingHeader ? (
              <Loader variant="spinner" size={20} />
            ) : (
              <span className="rounded-sm bg-black/40 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {header ? "Change header" : "Upload header"}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[10px] border border-border p-4">
        <h2 className="text-sm font-medium">Profile picture</h2>
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={() => pfpInput.current?.click()}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border border-border"
          >
            {pfp ? (
              <Image src={pfp} alt="Profile" width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-lg font-semibold text-muted-foreground">
                {fallbackName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              {uploadingPfp ? (
                <Loader variant="spinner" size={16} />
              ) : (
                <span className="rounded-sm bg-black/40 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Change
                </span>
              )}
            </div>
          </button>
          <div className="text-xs text-muted-foreground">
            <p>Click to upload a new profile picture.</p>
            <p>JPG, PNG, WebP, or GIF. Max 2MB.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[10px] border border-border p-4">
        <h2 className="text-sm font-medium">Public profile</h2>
        <label className="mt-4 block text-xs text-muted-foreground" htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Tell people about yourself..."
          className="mt-1 w-full resize-none rounded-[10px] border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-accent"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SocialField id="website" label="Website" value={website} onChange={setWebsite} placeholder="https://yoursite.com" />
          <SocialField id="github" label="GitHub" value={github} onChange={setGithub} placeholder={login || "username"} />
          <SocialField id="twitter" label="X" value={twitter} onChange={setTwitter} placeholder="username" />
          <SocialField id="discord" label="Discord" value={discord} onChange={setDiscord} placeholder="username" />
          <SocialField id="telegram" label="Telegram" value={telegram} onChange={setTelegram} placeholder="username" />
          <SocialField id="farcaster" label="Farcaster" value={farcaster} onChange={setFarcaster} placeholder="username" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
          {message && <span className="text-xs text-muted-foreground">{message}</span>}
        </div>
      </section>
    </div>
  );
}

function SocialField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-[10px] border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-accent"
      />
    </div>
  );
}
