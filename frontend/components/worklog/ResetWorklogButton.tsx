"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/motion/button";
import type { WorklogPayload } from "@/lib/worklog-run";

export function ResetWorklogButton({
  repoId,
  disabled = false,
  onPending,
  onReset,
}: {
  repoId: string;
  disabled?: boolean;
  onPending?: (pending: boolean) => void;
  onReset?: (payload: WorklogPayload) => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusy(next: boolean) {
    setPending(next);
    onPending?.(next);
  }

  async function onConfirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/repos/worklog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not reset the Worklog.");
        return;
      }
      setConfirming(false);
      onReset?.(data as WorklogPayload);
      router.refresh();
    } catch {
      setError("Could not reset the Worklog.");
    } finally {
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <div role="group" aria-label="Confirm Worklog reset" className="flex max-w-sm flex-col items-start gap-2">
        <p className="text-xs text-muted-foreground">
          Reset this Worklog? Saved entries are removed. The next update reads the latest 500 commits on the default branch.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setConfirming(false); setError(null); }} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Resetting..." : "Reset Worklog"}
          </Button>
        </div>
        {error ? <p className="max-w-xs text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive/10"
        onClick={() => setConfirming(true)}
        disabled={disabled || pending}
      >
        Reset Worklog
      </Button>
      {error ? <p className="max-w-xs text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
