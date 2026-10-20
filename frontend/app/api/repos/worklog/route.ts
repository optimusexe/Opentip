import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { loadWorklog, updateWorklog, userMaintainsRepo } from "@/lib/worklog-run";
import { WorklogGithubError } from "@/lib/worklog-github";

function repoIdOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const repoId = value.toLowerCase();
  const [owner, repo] = repoId.split("/");
  if (!owner || !repo || repoId.split("/").length !== 2) return null;
  if (!/^[a-z0-9._-]+$/.test(owner) || !/^[a-z0-9._-]+$/.test(repo)) return null;
  return repoId;
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
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const repoId = repoIdOf(body?.repoId);
  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });
  const maintains = await userMaintainsRepo(session, repoId);
  if (!maintains) return NextResponse.json({ error: "not repo owner" }, { status: 403 });

  try {
    const payload = await updateWorklog(repoId, (session as { accessToken?: string | null }).accessToken);
    const [owner, repo] = repoId.split("/");
    revalidatePath(`/${owner}/${repo}`);
    revalidatePath(`/${owner}/${repo}/worklog`);
    revalidatePath(`/${owner}/${repo}/manage`);
    return NextResponse.json({ ...payload, maintains: true });
  } catch (error) {
    if (error instanceof WorklogGithubError) {
      const status = error.status === 404 ? 404 : error.status === 400 ? 400 : error.status === 403 || error.status === 429 ? 429 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("worklog update failed");
    return NextResponse.json({ error: "Could not update the Worklog." }, { status: 500 });
  }
}
