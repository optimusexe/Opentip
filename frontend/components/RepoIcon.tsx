"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { normalizeRepoIcon, resolveRepoIcon } from "@/lib/repo-icon";

export function RepoIcon({
  repoId,
  logo,
  developerPfp,
  loadDeveloperPfp = false,
  size = 36,
  className = "size-9",
}: {
  repoId: string;
  logo?: string | null;
  developerPfp?: string | null;
  loadDeveloperPfp?: boolean;
  size?: number;
  className?: string;
}) {
  const [remotePfp, setRemotePfp] = useState<string | null>(null);
  const name = repoId.split("/")[1] || repoId;

  useEffect(() => {
    if (!loadDeveloperPfp) return;
    if (normalizeRepoIcon(logo) || normalizeRepoIcon(developerPfp)) return;
    const [owner, repo] = repoId.split("/");
    if (!owner || !repo) return;
    const controller = new AbortController();
    fetch(`/api/github/meta?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((meta) => {
        const url = meta?.owner?.avatar_url;
        if (typeof url === "string" && url.trim()) setRemotePfp(url);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [loadDeveloperPfp, logo, developerPfp, repoId]);

  const resolved = resolveRepoIcon({
    logo,
    developerPfp: developerPfp || remotePfp,
    name,
  });
  const frame = `${className} flex-shrink-0 rounded-[8px]`;

  if (resolved.kind === "image") {
    return <Image src={resolved.src} alt="" width={size} height={size} className={frame} />;
  }

  return (
    <span className={`flex items-center justify-center border border-border font-display ${frame}`}>
      {resolved.letter}
    </span>
  );
}
