import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { loadWorklog, resetWorklog, updateWorklog, userMaintainsRepo, WorklogBusyError } from "@/lib/worklog-run";
import { worklogWriteAuth } from "@/lib/worklog";
import { WorklogGithubError } from "@/lib/worklog-github";

function repoIdOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const repoId = value.toLowerCase();
  const [owner, repo] = repoId.split("/");
  if (!owner || !repo || repoId.split("/").length !== 2) return null;
  if (!/^[a-z0-9._-]+$/.test(owner) || !/^[a-z0-9._-]+$/.test(repo)) return null;
  return repoId;
}

function revalidateRepo(repoId: string) {
  const [owner, repo] = repoId.split("/");
  revalidatePath(`/${owner}/${repo}`);
  revalidatePath(`/${owner}/${repo}/worklog`);
  revalidatePath(`/${owner}/${repo}/manage`);
}

function worklogErrorResponse(error: unknown, fallback: string) {
  if (error instanceof WorklogBusyError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof WorklogGithubError) {
    const status = error.status === 404 ? 404 : error.status === 400 ? 400 : error.status === 403 || error.status === 429 ? 429 : 502;
    return NextResponse.json({ error: error.message }, { status });
  }
  console.error(fallback);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// Update and reset share this check. A signed-out caller is rejected before
// the maintainer lookup. A signed-in caller who does not maintain the repo
// is rejected with the same 403 as Update Worklog.
async function authorizeWorklogWrite(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => null);
  const repoId = repoIdOf(body?.repoId ?? req.nextUrl.searchParams.get("repoId"));
  if (!session?.user) {
    const denied = worklogWriteAuth(false, false);
    if (denied.ok) return { response: NextResponse.json({ error: "not authenticated" }, { status: 401 }) };
    return { response: NextResponse.json({ error: denied.error }, { status: denied.status }) };
  }
  if (!repoId) return { response: NextResponse.json({ error: "repoId required" }, { status: 400 }) };
  const maintains = await userMaintainsRepo(session, repoId);
  const decision = worklogWriteAuth(true, maintains);
  if (!decision.ok) return { response: NextResponse.json({ error: decision.error }, { status: decision.status }) };
  return { session, repoId };
}

export async function GET(req: NextRequest) {
  const repoId = repoIdOf(req.nextUrl.searchParams.get("repoId"));
  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });
  try {
    const payload = await loadWorklog(repoId);
    const session = await getServerSession(authOptions);
    const maintains = await userMaintainsRepo(session, repoId);
    return NextResponse.json({ ...payload, maintains });
  } catch {
    return NextResponse.json({ error: "Could not load the Worklog." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeWorklogWrite(req);
  if ("response" in auth) return auth.response;
  try {
    const payload = await updateWorklog(auth.repoId, (auth.session as { accessToken?: string | null }).accessToken);
    revalidateRepo(auth.repoId);
    return NextResponse.json({ ...payload, maintains: true });
  } catch (error) {
    return worklogErrorResponse(error, "Could not update the Worklog.");
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeWorklogWrite(req);
  if ("response" in auth) return auth.response;
  try {
    const payload = await resetWorklog(auth.repoId);
    revalidateRepo(auth.repoId);
    return NextResponse.json({ ...payload, maintains: true });
  } catch (error) {
    return worklogErrorResponse(error, "Could not reset the Worklog.");
  }
}
