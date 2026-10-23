"use client";

import { useEffect, useRef, useState } from "react";
import { BETA_FIELDS, type BetaFieldKey, normalizeGithubRepoUrl, parseBetaApplication, questionError } from "@/lib/beta-application";

type Answers = {
  name: string;
  email: string;
  githubUsername: string;
  xHandle: string;
  repoUrl: string;
  projectSummary: string;
  docsReaders: string;
  docsTooling: string;
  docsPain: string;
  pushFrequency: string;
  monthlyPayUsd: string;
  feedbackCall: boolean | null;
};

const EMPTY: Answers = {
  name: "",
  email: "",
  githubUsername: "",
  xHandle: "",
  repoUrl: "",
  projectSummary: "",
  docsReaders: "",
  docsTooling: "",
  docsPain: "",
  pushFrequency: "",
  monthlyPayUsd: "",
  feedbackCall: null,
};

type Step = "intro" | number | "review" | "done";

function reviewValue(key: BetaFieldKey, answers: Answers): string {
  if (key === "feedbackCall") {
    if (answers.feedbackCall === true) return "Yes";
    if (answers.feedbackCall === false) return "No";
    return "Blank";
  }
  if (key === "monthlyPayUsd") {
    return answers.monthlyPayUsd.trim() ? `$${answers.monthlyPayUsd.trim()}` : "Blank";
  }
  if (key === "xHandle") return answers.xHandle.trim() || "Blank";
  if (key === "repoUrl") {
    return normalizeGithubRepoUrl(answers.repoUrl) || answers.repoUrl.trim() || "Blank";
  }
  return answers[key].trim() || "Blank";
}

export function BetaForm() {
  const [step, setStep] = useState<Step>("intro");
  const [returnToReview, setReturnToReview] = useState(false);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function setField<K extends BetaFieldKey>(key: K, value: Answers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function continueFrom(index: number) {
    const field = BETA_FIELDS[index];
    const problem = questionError(field.key, answers[field.key]);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    if (returnToReview) {
      setReturnToReview(false);
      setStep("review");
      return;
    }
    setStep(index === BETA_FIELDS.length - 1 ? "review" : index + 1);
  }

  function goBack(index: number) {
    setError("");
    if (returnToReview) {
      setReturnToReview(false);
      setStep("review");
      return;
    }
    if (index > 0) setStep(index - 1);
  }

  function edit(index: number) {
    setError("");
    setReturnToReview(true);
    setStep(index);
  }

  async function submit() {
    for (let index = 0; index < BETA_FIELDS.length; index += 1) {
      const field = BETA_FIELDS[index];
      const problem = questionError(field.key, answers[field.key]);
      if (problem) {
        setReturnToReview(true);
        setError(problem);
        setStep(index);
        return;
      }
    }
    const parsed = parseBetaApplication(answers);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/beta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.value),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || "We could not save your application. Try again in a moment.");
        return;
      }
      setStep("done");
    } catch {
      setError("We could not save your application. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mkt-w mkt-apply">
        <h1 tabIndex={-1} ref={headingRef}>You're on the list.</h1>
        <p className="mkt-sub">Thanks for applying. We'll send your beta access to your email.</p>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <form
        className="mkt-w mkt-apply"
        onSubmit={(event) => {
          event.preventDefault();
          setStep(0);
        }}
      >
        <p className="mkt-label">Beta</p>
        <h1 tabIndex={-1} ref={headingRef}>Apply for the beta</h1>
        <p className="mkt-sub">About 2 minutes. Tell us about the repo you want to try.</p>
        <div className="mkt-row">
          <button className="mkt-btn mkt-pri" type="submit">Next</button>
        </div>
      </form>
    );
  }

  if (step === "review") {
    return (
      <div className="mkt-w mkt-apply">
        <h1 tabIndex={-1} ref={headingRef}>Check your answers</h1>
        <ul className="mkt-review">
          {BETA_FIELDS.map((field, index) => (
            <li key={field.key}>
              <div>
                <span>{field.title}</span>
                <p>{reviewValue(field.key, answers)}</p>
              </div>
              <button type="button" onClick={() => edit(index)}>Edit</button>
            </li>
          ))}
        </ul>
        {error ? <p className="mkt-error" role="alert">{error}</p> : null}
        <div className="mkt-row">
          <button className="mkt-btn" type="button" onClick={() => { setError(""); setStep(BETA_FIELDS.length - 1); }}>Back</button>
          <button className="mkt-btn mkt-pri" type="button" disabled={pending} onClick={() => void submit()}>
            {pending ? "Sending" : "Submit application"}
          </button>
        </div>
      </div>
    );
  }

  const field = BETA_FIELDS[step];
  const count = step + 1;
  return (
    <form
      className="mkt-w mkt-apply"
      onSubmit={(event) => {
        event.preventDefault();
        continueFrom(step);
      }}
    >
      <p className="mkt-count">{count} of {BETA_FIELDS.length}</p>
      <div
        className="mkt-progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={BETA_FIELDS.length}
        aria-valuenow={count}
        aria-label={`Question ${count} of ${BETA_FIELDS.length}`}
      >
        <span style={{ width: `${(count / BETA_FIELDS.length) * 100}%` }} />
      </div>
      <h1 tabIndex={-1} ref={headingRef}>{field.title}</h1>
      {field.help ? <p className="mkt-help">{field.help}</p> : null}
      <Field fieldKey={field.key} kind={field.kind} answers={answers} onChange={setField} />
      {error ? <p className="mkt-error" role="alert">{error}</p> : null}
      <div className="mkt-row">
        {step > 0 ? <button className="mkt-btn" type="button" onClick={() => goBack(step)}>Back</button> : null}
        <button className="mkt-btn mkt-pri" type="submit">Next</button>
      </div>
    </form>
  );
}

function Field({
  fieldKey,
  kind,
  answers,
  onChange,
}: {
  fieldKey: BetaFieldKey;
  kind: (typeof BETA_FIELDS)[number]["kind"];
  answers: Answers;
  onChange: <K extends BetaFieldKey>(key: K, value: Answers[K]) => void;
}) {
  if (fieldKey === "feedbackCall") {
    return (
      <div className="mkt-choices">
        <label className={answers.feedbackCall === true ? "mkt-choice is-on" : "mkt-choice"}>
          <input
            type="radio"
            name="feedbackCall"
            checked={answers.feedbackCall === true}
            onChange={() => onChange("feedbackCall", true)}
          />
          Yes
        </label>
        <label className={answers.feedbackCall === false ? "mkt-choice is-on" : "mkt-choice"}>
          <input
            type="radio"
            name="feedbackCall"
            checked={answers.feedbackCall === false}
            onChange={() => onChange("feedbackCall", false)}
          />
          No
        </label>
      </div>
    );
  }

  if (fieldKey === "monthlyPayUsd") {
    return (
      <div className="mkt-pay">
        <span aria-hidden="true">$</span>
        <input
          name="monthlyPayUsd"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Dollars per month"
          value={answers.monthlyPayUsd}
          onChange={(event) => onChange("monthlyPayUsd", event.target.value)}
        />
      </div>
    );
  }

  const type = kind === "email" ? "email" : kind === "url" ? "url" : "text";
  const autoComplete = fieldKey === "name" ? "name" : fieldKey === "email" ? "email" : "off";
  return (
    <input
      className="mkt-field"
      name={fieldKey}
      type={type}
      autoComplete={autoComplete}
      value={answers[fieldKey]}
      onChange={(event) => onChange(fieldKey, event.target.value)}
    />
  );
}
