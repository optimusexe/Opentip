import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: "https://opentip.tech", lastModified: new Date() },
    { url: "https://opentip.tech/repos", lastModified: new Date() },
    { url: "https://opentip.tech/activity", lastModified: new Date() },
    { url: "https://opentip.tech/leaderboard", lastModified: new Date() },
  ];
  // Preview builds do not receive DATABASE_URL (it is production-only). Skip the
  // repo and developer URLs there so prerender can finish. Production still queries.
  if (!process.env.DATABASE_URL) return pages;

  const repos = await prisma.repo.findMany({ where: { hidden: false }, select: { repo_id: true } });
  const devs = await prisma.user.findMany({ where: { login: { not: null } }, select: { login: true } });

  return [
    ...pages,
    ...repos.map(r => ({ url: `https://opentip.tech/${r.repo_id}`, lastModified: new Date() })),
    ...devs.filter(d => d.login).map(d => ({ url: `https://opentip.tech/dev/${d.login}`, lastModified: new Date() })),
  ];
}
