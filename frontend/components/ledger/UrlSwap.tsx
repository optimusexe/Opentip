"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/motion/button";
import { fundingPath, parseGithubRepo } from "@/components/home/parse-repo";
import { cn } from "@/lib/utils";

const ERROR = "Enter owner/repo, or paste a GitHub URL.";

export function UrlSwap({
  initial = "vercel/next.js",
  button = "Tip this repo",
  compact = false,
  onNavigate,
}: {
  initial?: string;
  button?: string;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseGithubRepo(value);
    if (!parsed) {
      setError(ERROR);
      return;
    }
    setError(null);
    onNavigate?.();
    router.push(fundingPath(parsed));
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2" noValidate>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-[10px] border border-border bg-card p-1.5 sm:flex-row sm:items-center sm:rounded-full sm:pl-4",
          compact && "sm:pl-3",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 px-2 font-mono text-[13px] sm:flex-nowrap sm:px-0">
          <span className="text-muted-foreground">https://</span>
          <span className="host-swap" aria-hidden>
            <span className="host-swap-github">github.com</span>
            <span className="host-swap-opentip">opentip.tech/tip</span>
          </span>
          <span className="sr-only">opentip.tech/tip</span>
          <span className="text-muted-foreground">/</span>
          <input
            aria-label="Repository"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            placeholder="owner/repo"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 basis-full bg-transparent font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground sm:basis-auto"
          />
        </div>
        <Button type="submit" className="h-10 rounded-full px-4">
          {button}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      {error ? (
        <p className="px-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
