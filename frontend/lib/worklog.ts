// Pure Worklog pipeline: drop noise, group a burst of commits, and write
// the visitor-facing title. GitHub and Groq live in the callers.

export const WORKLOG_FIRST_WINDOW_DAYS = 14;
export const WORKLOG_COMMIT_CAP = 80;
const CLUSTER_GAP_MS = 30 * 60 * 60 * 1000;

export type WorklogSourceCommit = {
  sha: string;
  message: string;
  committedAt: string;
  url: string;
  parentCount: number;
  files?: { path: string }[];
};

export type WorklogDraft = {
  start: string;
  end: string;
  title: string;
  why: string;
  commits: WorklogSourceCommit[];
};

export type WorklogModelEntry = {
  title: string;
  why: string;
  shas: string[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function subjectOf(message: string): string {
  return message.split("\n")[0]?.trim() ?? "";
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

export function isNoiseCommit(commit: WorklogSourceCommit): boolean {
  const subject = subjectOf(commit.message);
  if (!commit.sha || !subject) return true;
  if (commit.parentCount > 1) return true;
  if (/^merge\b/i.test(subject)) return true;
  if (/^ci(?:\(|:|\s)/i.test(subject)) return true;
  if (/remove comments|comments that restate|comment-only/i.test(subject)) return true;
  if (/agent rule|agents\.md|\.cursor\//i.test(subject)) return true;
  if (/^docs?:\s/i.test(subject) && /agent|cursor|internal process/i.test(subject)) return true;
  if (/refuse to seed|database_url is local/i.test(subject)) return true;
  if (/ping-db|remove\s+.*\bscript\b/i.test(subject)) return true;
  // Generated-image plumbing (font files, tracing, generator swaps).
  // A change to what a shared link shows is not this class.
  if (/trace open graph|open graph fonts|static file url|bundled fonts|site open graph image/i.test(subject)) return true;
  if (commit.files && commit.files.length > 0 && commit.files.every((file) => file.path.startsWith(".github/"))) return true;
  return false;
}

export function selectWorklogCommits(commits: WorklogSourceCommit[]): WorklogSourceCommit[] {
  return commits.filter((commit) => !isNoiseCommit(commit));
}

function utcDayNumber(iso: string): number {
  const date = new Date(iso);
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
}

export function clusterWorklogCommits(commits: WorklogSourceCommit[]): WorklogSourceCommit[][] {
  const ordered = [...commits].sort((a, b) => a.committedAt.localeCompare(b.committedAt) || a.sha.localeCompare(b.sha));
  const clusters: WorklogSourceCommit[][] = [];
  for (const commit of ordered) {
    const current = clusters[clusters.length - 1];
    const previous = current?.[current.length - 1];
    const gap = previous ? new Date(commit.committedAt).getTime() - new Date(previous.committedAt).getTime() : 0;
    const dayJump = previous ? utcDayNumber(commit.committedAt) - utcDayNumber(previous.committedAt) : 0;
    if (!current || gap > CLUSTER_GAP_MS || dayJump >= 2) clusters.push([commit]);
    else current.push(commit);
  }
  return clusters;
}

function cleanSubject(subject: string): string {
  return subject
    .replace(/\s*\(#\d+\)\s*$/, "")
    .replace(/^[a-z]+(?:\([^)]+\))?!?:\s+/i, "")
    .trim();
}

function asSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Shipped an update.";
  const sentence = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

export function summarizeCluster(commits: WorklogSourceCommit[]): { title: string; why: string } {
  const text = commits.map((commit) => subjectOf(commit.message)).join("\n");
  const share = /share card|own url and image|own card/i.test(text);
  const logo = /logo/i.test(text);
  const totals = /landing card total|across every visible repo|homepage total|totals tips across/i.test(text);
  const look = /ledger|restyle/i.test(text);
  const receipt = /receipt/i.test(text);
  const wallet = /token logo|wallet card|wallet page/i.test(text);
  const guard = /assertlocaldb|reject |fix\(db\)|fix\(copy\)|fix\(ui\)|fix\(wallet\)|fix\(contrast\)|fix\(fee\)|fix\(repo-icon\)/i.test(text);
  const feeOrDb = /platform split|from the chain|database|migration/i.test(text);

  if (share && commits.length <= 3) {
    return {
      title: "Shared repo links now show the repo's own card everywhere.",
      why: "A repo posted on X, LinkedIn or Telegram shows its tips and logo, not the generic Opentip image.",
    };
  }
  if (logo && totals) {
    return {
      title: "Your project logo now shows everywhere, and the homepage totals tips across all repos.",
      why: "Maintainers who upload a logo see it in every list and sort, and the homepage reflects the whole community.",
    };
  }
  if ([look, receipt, wallet].filter(Boolean).length >= 2) {
    return {
      title: "A fresh new look, downloadable tip receipts, and wallet token logos.",
      why: "Tippers get a real receipt to share, and the wallet shows clearly what you hold.",
    };
  }
  if (guard && feeOrDb && commits.length >= 5) {
    return {
      title: "Behind the scenes cleanup so fixes stay fixed.",
      why: "The platform fee is read straight from the contract and new databases build correctly.",
    };
  }

  const subjects = commits.map((commit) => cleanSubject(subjectOf(commit.message))).filter(Boolean);
  return {
    title: asSentence(subjects[0] || "Shipped an update"),
    why: subjects.length > 1 ? asSentence(subjects[1]) : "This shipped on the default branch.",
  };
}

function newestFirst(commits: WorklogSourceCommit[]): WorklogSourceCommit[] {
  return [...commits].sort((a, b) => b.committedAt.localeCompare(a.committedAt) || a.sha.localeCompare(b.sha));
}

export function draftWorklogEntries(commits: WorklogSourceCommit[]): WorklogDraft[] {
  const newest = selectWorklogCommits(commits)
    .sort((a, b) => b.committedAt.localeCompare(a.committedAt) || a.sha.localeCompare(b.sha))
    .slice(0, WORKLOG_COMMIT_CAP);
  return clusterWorklogCommits(newest)
    .map((cluster) => {
      const summary = summarizeCluster(cluster);
      const ordered = newestFirst(cluster);
      return {
        start: ordered[ordered.length - 1].committedAt,
        end: ordered[0].committedAt,
        title: summary.title,
        why: summary.why,
        commits: ordered,
      };
    })
    .sort((a, b) => b.end.localeCompare(a.end));
}

export function sanitizeWorklogCopy(text: string): string | null {
  const clean = text.replace(/—/g, ", ").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (/\bfund(ing|ed|er|ers)?\b/i.test(clean)) return null;
  return clean;
}

export function parseWorklogModel(content: string): WorklogModelEntry[] | null {
  const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace < 0) return null;
    try {
      parsed = JSON.parse(cleaned.slice(0, lastBrace + 1));
    } catch {
      return null;
    }
  }
  const entries = parsed && typeof parsed === "object" && "entries" in parsed ? (parsed as { entries?: unknown }).entries : parsed;
  if (!Array.isArray(entries)) return null;
  const out: WorklogModelEntry[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as { title?: unknown; why?: unknown; shas?: unknown };
    const title = typeof row.title === "string" ? sanitizeWorklogCopy(row.title) : null;
    const why = typeof row.why === "string" ? sanitizeWorklogCopy(row.why) : null;
    const shas = Array.isArray(row.shas) ? row.shas.filter((sha): sha is string => typeof sha === "string" && sha.length > 0) : [];
    if (!title || !why || shas.length === 0) continue;
    out.push({ title, why, shas });
  }
  return out.length > 0 ? out : null;
}

export function entriesFromModel(commits: WorklogSourceCommit[], model: WorklogModelEntry[]): WorklogDraft[] | null {
  const bySha = new Map(selectWorklogCommits(commits).map((commit) => [commit.sha, commit]));
  const used = new Set<string>();
  const drafts: WorklogDraft[] = [];
  for (const entry of model) {
    const title = sanitizeWorklogCopy(entry.title);
    const why = sanitizeWorklogCopy(entry.why);
    if (!title || !why) continue;
    const grouped: WorklogSourceCommit[] = [];
    for (const sha of entry.shas) {
      const commit = bySha.get(sha);
      if (!commit || used.has(sha)) continue;
      used.add(sha);
      grouped.push(commit);
    }
    if (grouped.length === 0) continue;
    const ordered = newestFirst(grouped);
    drafts.push({
      start: ordered[ordered.length - 1].committedAt,
      end: ordered[0].committedAt,
      title,
      why,
      commits: ordered,
    });
  }
  if (drafts.length === 0) return null;
  return drafts.sort((a, b) => b.end.localeCompare(a.end));
}

export function buildWorklogPrompt(owner: string, repo: string, branch: string, commits: WorklogSourceCommit[]): string {
  const lines = newestFirst(selectWorklogCommits(commits))
    .slice(0, WORKLOG_COMMIT_CAP)
    .map((commit) => `${commit.sha} ${commit.committedAt} ${subjectOf(commit.message)}`)
    .join("\n");
  return `Group these already-filtered commits from ${owner}/${repo} (${branch}) into Worklog entries.

Commits (newest first):
${lines}

Output ONLY valid JSON:
{"entries":[{"title":"one sentence","why":"one sentence a visitor cares about","shas":["full sha"]}]}

Rules:
- Group commits from the same effort. A small visible change still gets kept.
- Title and why are plain language for someone who does not read the code.
- Say tip, tips, or tipped. Do not say fund, funding, funded, or funder.
- Do not use an em dash.
- Every sha must be copied from the list above. Do not invent shas.
- Order entries newest first.`;
}

export function formatWorklogRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const left = `${MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}`;
  if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth() && start.getUTCDate() === end.getUTCDate()) {
    return left;
  }
  if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()) {
    return `${left} to ${end.getUTCDate()}`;
  }
  return `${left} to ${MONTHS[end.getUTCMonth()]} ${end.getUTCDate()}`;
}

export function formatWorklogUpdated(iso: string): string {
  const date = new Date(iso);
  const month = MONTHS[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const hour24 = date.getUTCHours();
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const hour = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${month} ${day}, ${year}, ${hour}:${minute} ${suffix} UTC`;
}
