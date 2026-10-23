import { NextResponse } from "next/server";
import { parseBetaApplication } from "@/lib/beta-application";
import { betaDatabaseConfigured, getBetaPool, safeDbError } from "@/lib/beta-db";
import { RateLimitError, rateLimit, rateLimitKey } from "@/lib/rate-limit";

const INSERT = `
  INSERT INTO beta_application (
    name, email, github_username, x_handle, repo_url,
    project_summary, docs_readers, docs_tooling, docs_pain,
    push_frequency, monthly_pay_usd, feedback_call
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
`;

export async function POST(req: Request) {
  try {
    rateLimit(rateLimitKey(req, "beta"), "critical");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Too many applications from this network. Try again in a minute." },
        { status: 429, headers: { "Retry-After": String(error.retryAfter) } },
      );
    }
    throw error;
  }

  const raw = await req.text();
  if (raw.length > 20_000) {
    return NextResponse.json({ error: "Check your answers and try again." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Check your answers and try again." }, { status: 400 });
  }
  const parsed = parseBetaApplication(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (!betaDatabaseConfigured()) {
    console.error("BETA_DATABASE_URL is not set. Beta applications are not being stored.");
    return NextResponse.json({ error: "We could not save your application. Try again later." }, { status: 503 });
  }

  const row = parsed.value;
  try {
    await getBetaPool().query(INSERT, [
      row.name,
      row.email,
      row.githubUsername,
      row.xHandle,
      row.repoUrl,
      row.projectSummary,
      row.docsReaders,
      row.docsTooling,
      row.docsPain,
      row.pushFrequency,
      row.monthlyPayUsd,
      row.feedbackCall,
    ]);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23505") {
      return NextResponse.json(
        { error: "This email is already on the list. We'll send beta access there." },
        { status: 409 },
      );
    }
    console.error("beta application insert failed", code || safeDbError(error));
    return NextResponse.json({ error: "We could not save your application. Try again in a moment." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
