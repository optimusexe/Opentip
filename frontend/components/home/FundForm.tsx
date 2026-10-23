"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fundingPath, parseGithubRepo } from "@/components/home/parse-repo";

const ERROR = "Enter a GitHub repo as owner/repo or a github.com link.";

export function FundForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseGithubRepo(value);
    if (!parsed) {
      setError(ERROR);
      return;
    }
    router.push(fundingPath(parsed));
  }

  return (
    <form className="fund-form" onSubmit={onSubmit} noValidate>
      <label htmlFor="repo-url">Paste a GitHub repo URL</label>
      <div className="fund-bar">
        <input
          id="repo-url"
          name="repo"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder="github.com/owner/repo"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          inputMode="url"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "repo-hint repo-error" : "repo-hint"}
          className="fund-input"
        />
        <button type="submit" className="fund-submit">
          Tip this repo
          <ArrowIcon />
        </button>
      </div>
      <p id="repo-hint" className="fund-hint">
        github.com/owner/repo, a full GitHub URL, or owner/repo.
      </p>
      {error ? (
        <p id="repo-error" className="fund-error" role="alert">
          {error}
        </p>
      ) : null}
      <noscript>
        <p className="fund-hint">
          This field needs JavaScript. You can <a href="/tip/repos">browse repos</a> instead.
        </p>
      </noscript>
    </form>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="arrow-icon">
      <path
        d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
