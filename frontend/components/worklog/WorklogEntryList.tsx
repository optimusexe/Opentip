"use client";

import { useState } from "react";
import { shortSha } from "@/lib/worklog";
import type { WorklogEntryView } from "@/lib/worklog-run";

export function WorklogEntryList({ entries }: { entries: WorklogEntryView[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (entries.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">No entries yet. An update reads recent commits on the default branch.</p>;
  }

  return (
    <div>
      {entries.map((entry) => {
        const count = entry.commits.length;
        const expanded = open[entry.id] === true;
        const noun = count === 1 ? "commit" : "commits";
        return (
          <article key={entry.id} className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3 border-t border-border py-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
            <p className="text-xs leading-snug text-muted-foreground">{entry.label}</p>
            <div className="min-w-0">
              <h3 className="font-medium leading-snug">{entry.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.why}</p>
              {count > 0 ? (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand"
                  aria-expanded={expanded}
                  onClick={() => setOpen((current) => ({ ...current, [entry.id]: !expanded }))}
                >
                  <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
                  {expanded ? `Hide ${count} ${noun}` : `${count} ${noun}`}
                </button>
              ) : null}
              {expanded ? (
                <ul className="mt-2 space-y-1.5 border-l border-border pl-3">
                  {entry.commits.map((commit) => (
                    <li key={commit.sha} className="text-sm leading-snug">
                      <a href={commit.url} className="font-mono text-xs text-brand hover:underline" target="_blank" rel="noreferrer">
                        {shortSha(commit.sha)}
                      </a>{" "}
                      <span className="text-foreground">{commit.message}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
