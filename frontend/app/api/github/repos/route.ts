import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { GITHUB_REPO_AFFILIATION, githubReposErrorMessage, parseGithubRepoPage } from "@/lib/github-repo-page";

export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  // Never fall back to the server token: /user/repos would list that token's
  // private repositories to anyone with an email session.
  const token = session.accessToken;
  if (!token) {
    return NextResponse.json({ repos: [], error: "Connect GitHub to list your repositories" });
  }
  const paging = parseGithubRepoPage(
    req.nextUrl.searchParams.get("page"),
    req.nextUrl.searchParams.get("per_page"),
  );
  if ("error" in paging) return NextResponse.json({ error: paging.error }, { status: 400 });
  const { page, per_page } = paging;
  const res = await fetch(`https://api.github.com/user/repos?per_page=${per_page}&page=${page}&sort=updated&affiliation=${GITHUB_REPO_AFFILIATION}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) return NextResponse.json({ error: githubReposErrorMessage(res.status) }, { status: res.status });
  const repos = await res.json();
  // trim to essentials
  const out = repos.map((r:any)=> ({ full_name: r.full_name, name: r.name, owner: r.owner.login, avatar_url: r.owner.avatar_url, description: r.description, stargazers_count: r.stargazers_count, private: r.private }));
  return NextResponse.json(out);
}
