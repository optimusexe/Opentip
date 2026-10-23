import { z } from "zod";

export const BETA_FIELDS = [
  { key: "name", title: "What's your name?", help: "", kind: "text" },
  { key: "email", title: "What's your email?", help: "We send beta access here.", kind: "email" },
  { key: "githubUsername", title: "What's your GitHub username?", help: "", kind: "text" },
  { key: "xHandle", title: "What's your X handle?", help: "Optional.", kind: "text" },
  { key: "repoUrl", title: "Which repo should we try?", help: "A github.com URL.", kind: "url" },
  { key: "projectSummary", title: "What is the project?", help: "", kind: "text" },
  { key: "docsReaders", title: "Who reads its docs today?", help: "", kind: "text" },
  { key: "docsTooling", title: "What do you use for docs now?", help: "", kind: "text" },
  { key: "docsPain", title: "What's the biggest docs pain?", help: "", kind: "text" },
  { key: "pushFrequency", title: "How often do you push?", help: "", kind: "text" },
  { key: "monthlyPayUsd", title: "How much would you pay per month?", help: "Optional. Leave it blank if you'd rather not say.", kind: "money" },
  { key: "feedbackCall", title: "Would you do a 15 minute feedback call?", help: "", kind: "choice" },
] as const;

export type BetaFieldKey = (typeof BETA_FIELDS)[number]["key"];

const MESSAGES: Record<BetaFieldKey, string> = {
  name: "Enter your name.",
  email: "Enter a valid email. We send beta access here.",
  githubUsername: "Enter your GitHub username.",
  xHandle: "Enter an X handle, or leave this blank.",
  repoUrl: "Enter a github.com repository URL.",
  projectSummary: "Tell us what the project is.",
  docsReaders: "Tell us who reads the docs.",
  docsTooling: "Tell us what you use for docs now.",
  docsPain: "Tell us the biggest docs pain.",
  pushFrequency: "Tell us how often you push.",
  monthlyPayUsd: "Enter a number, or leave this blank.",
  feedbackCall: "Choose yes or no.",
};

const LONG_TEXT: ReadonlySet<BetaFieldKey> = new Set([
  "projectSummary",
  "docsReaders",
  "docsTooling",
  "docsPain",
  "pushFrequency",
]);

export type BetaApplication = {
  name: string;
  email: string;
  githubUsername: string;
  xHandle: string | null;
  repoUrl: string;
  projectSummary: string;
  docsReaders: string;
  docsTooling: string;
  docsPain: string;
  pushFrequency: string;
  monthlyPayUsd: string | null;
  feedbackCall: boolean;
};

const looseSchema = z.object({
  name: z.unknown(),
  email: z.unknown(),
  githubUsername: z.unknown(),
  xHandle: z.unknown().optional(),
  repoUrl: z.unknown(),
  projectSummary: z.unknown(),
  docsReaders: z.unknown(),
  docsTooling: z.unknown(),
  docsPain: z.unknown(),
  pushFrequency: z.unknown(),
  monthlyPayUsd: z.unknown().optional(),
  feedbackCall: z.unknown(),
});

export function normalizeGithubUsername(value: string): string | null {
  const name = value.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(name)) return null;
  if (name.includes("--")) return null;
  return name;
}

export function normalizeXHandle(value: string): string | null | undefined {
  const name = value.trim().replace(/^@/, "");
  if (!name) return null;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(name)) return undefined;
  return name;
}

export function normalizeGithubRepoUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 300) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "github.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!owner || !repo || !/^[A-Za-z0-9._-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(repo)) return null;
  return `https://github.com/${owner}/${repo}`;
}

export function parseMonthlyPay(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return undefined;
    const cents = Math.round(value * 100);
    if (Math.abs(cents - value * 100) > 1e-6) return undefined;
    return (cents / 100).toFixed(2);
  }
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(trimmed)) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed > 1_000_000) return undefined;
  return parsed.toFixed(2);
}

function textAnswer(key: BetaFieldKey, value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const max = LONG_TEXT.has(key) ? 2000 : 120;
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export function questionError(key: BetaFieldKey, value: unknown): string | null {
  if (key === "email") {
    if (typeof value !== "string") return MESSAGES.email;
    const email = value.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return MESSAGES.email;
    return null;
  }
  if (key === "githubUsername") {
    if (typeof value !== "string" || !normalizeGithubUsername(value)) return MESSAGES.githubUsername;
    return null;
  }
  if (key === "xHandle") {
    if (value == null || value === "") return null;
    if (typeof value !== "string" || normalizeXHandle(value) === undefined) return MESSAGES.xHandle;
    return null;
  }
  if (key === "repoUrl") {
    if (typeof value !== "string" || !normalizeGithubRepoUrl(value)) return MESSAGES.repoUrl;
    return null;
  }
  if (key === "monthlyPayUsd") {
    if (parseMonthlyPay(value) === undefined) return MESSAGES.monthlyPayUsd;
    return null;
  }
  if (key === "feedbackCall") {
    if (typeof value !== "boolean") return MESSAGES.feedbackCall;
    return null;
  }
  if (!textAnswer(key, value)) return MESSAGES[key];
  return null;
}

export function parseBetaApplication(input: unknown): { ok: true; value: BetaApplication } | { ok: false; error: string } {
  const loose = looseSchema.safeParse(input);
  if (!loose.success) return { ok: false, error: "Check your answers and try again." };
  for (const field of BETA_FIELDS) {
    const error = questionError(field.key, loose.data[field.key]);
    if (error) return { ok: false, error };
  }
  const data = loose.data;
  const name = textAnswer("name", data.name);
  const projectSummary = textAnswer("projectSummary", data.projectSummary);
  const docsReaders = textAnswer("docsReaders", data.docsReaders);
  const docsTooling = textAnswer("docsTooling", data.docsTooling);
  const docsPain = textAnswer("docsPain", data.docsPain);
  const pushFrequency = textAnswer("pushFrequency", data.pushFrequency);
  const githubUsername = typeof data.githubUsername === "string" ? normalizeGithubUsername(data.githubUsername) : null;
  const repoUrl = typeof data.repoUrl === "string" ? normalizeGithubRepoUrl(data.repoUrl) : null;
  const monthlyPayUsd = parseMonthlyPay(data.monthlyPayUsd);
  const xHandle = typeof data.xHandle === "string" ? normalizeXHandle(data.xHandle) : null;
  if (
    !name
    || typeof data.email !== "string"
    || !githubUsername
    || xHandle === undefined
    || !repoUrl
    || !projectSummary
    || !docsReaders
    || !docsTooling
    || !docsPain
    || !pushFrequency
    || monthlyPayUsd === undefined
    || typeof data.feedbackCall !== "boolean"
  ) {
    return { ok: false, error: "Check your answers and try again." };
  }
  return {
    ok: true,
    value: {
      name,
      email: data.email.trim().toLowerCase(),
      githubUsername,
      xHandle,
      repoUrl,
      projectSummary,
      docsReaders,
      docsTooling,
      docsPain,
      pushFrequency,
      monthlyPayUsd,
      feedbackCall: data.feedbackCall,
    },
  };
}
