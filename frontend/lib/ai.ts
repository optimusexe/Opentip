import { fetchRepoFilesForSummary, type RepoFiles } from "./github";
import {
  buildWorklogPrompt,
  draftWorklogEntries,
  entriesFromModel,
  parseWorklogModel,
  type WorklogDraft,
  type WorklogSourceCommit,
} from "./worklog";

export type RepoSummary = {
  description: string;
  techStack: string[];
  features: string[];
  audience: string;
};

function buildPrompt(owner: string, repo: string, data: RepoFiles): string {
  const fileContents = Object.entries(data.files)
    .map(([path, content]) => `--- ${path} ---\n${content}`)
    .join("\n\n");

  const treeSample = data.tree.slice(0, 80).join("\n");

  return `Analyze this open-source project and output ONLY valid JSON (no markdown, no explanation).

Repository: ${owner}/${repo}

Tree:
${treeSample}

Files:
${fileContents}

Output exactly this JSON and nothing else:
{"description":"1-2 sentences on what it does","techStack":["tech1","tech2"],"features":["feat1","feat2","feat3"],"audience":"who it is for"}

Rules: description under 100 words. 3 features max. 2-4 technologies. Short audience.`;
}

function fallbackSummary(owner: string, _repo: string): RepoSummary {
  return {
    description: `An open-source project by ${owner}.`,
    techStack: [],
    features: [],
    audience: "Developers and open-source contributors",
  };
}

export async function generateRepoSummary(owner: string, repo: string): Promise<RepoSummary> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallbackSummary(owner, repo);

  try {
    const data = await fetchRepoFilesForSummary(owner, repo);
    const prompt = buildPrompt(owner, repo, data);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You are a technical writer who creates concise, accurate summaries of open-source projects. Always respond with valid JSON only — no markdown fences, no explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_completion_tokens: 1024,
      }),
    });

    if (!res.ok) {
      console.error("Groq API error:", res.status, await res.text());
      return fallbackSummary(owner, repo);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallbackSummary(owner, repo);

    // Parse — strip markdown fences if present
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to repair truncated JSON: find last complete closing brace
      const lastBrace = cleaned.lastIndexOf("}");
      if (lastBrace > 0) {
        try {
          parsed = JSON.parse(cleaned.slice(0, lastBrace + 1));
        } catch {
          return fallbackSummary(owner, repo);
        }
      } else {
        return fallbackSummary(owner, repo);
      }
    }

    return {
      description: typeof parsed.description === "string" ? parsed.description : fallbackSummary(owner, repo).description,
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack.slice(0, 6) : [],
      features: Array.isArray(parsed.features) ? parsed.features.slice(0, 5) : [],
      audience: typeof parsed.audience === "string" ? parsed.audience : "",
    };
  } catch (e) {
    console.error("generateRepoSummary error:", e);
    return fallbackSummary(owner, repo);
  }
}

export async function summarizeWorklogCommits(
  owner: string,
  repo: string,
  branch: string,
  commits: WorklogSourceCommit[],
): Promise<WorklogDraft[]> {
  const local = draftWorklogEntries(commits);
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || local.length === 0) return local;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You group repository commits into a Worklog. Always respond with valid JSON only. No markdown fences.",
          },
          { role: "user", content: buildWorklogPrompt(owner, repo, branch, commits) },
        ],
        temperature: 0.2,
        max_completion_tokens: 2048,
      }),
    });
    if (!res.ok) {
      console.error("Groq worklog error:", res.status);
      return local;
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string") return local;
    const parsed = parseWorklogModel(content);
    if (!parsed) return local;
    return entriesFromModel(commits, parsed) ?? local;
  } catch (error) {
    console.error("summarizeWorklogCommits error:", error);
    return local;
  }
}
