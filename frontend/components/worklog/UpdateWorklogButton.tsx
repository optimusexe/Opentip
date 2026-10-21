"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/motion/button";
import type { WorklogPayload } from "@/lib/worklog-run";

export function UpdateWorklogButton({
  repoId,
  onPhase,
}: {
  repoId: string;
  onPhase?: (phase: "checking" | "done", payload?: WorklogPayload) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    onPhase?.("checking");
    try {
      const res = await fetch("/api/repos/worklog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not update the Worklog.");
        onPhase?.("done");
        return;
      }
      onPhase?.("done", data as WorklogPayload);
      router.refresh();
    } catch {
      setError("Could not update the Worklog.");
      onPhase?.("done");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button onClick={onClick} disabled={pending}>
        <RefreshCw className={pending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        Update Worklog
      </Button>
      {error ? <p className="max-w-xs text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
