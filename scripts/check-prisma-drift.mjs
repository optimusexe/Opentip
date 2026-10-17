import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const shadowUrl = process.env.SHADOW_DATABASE_URL || "postgresql://opentip:opentip@127.0.0.1:5432/opentip_shadow";
const adminUrl = process.env.LOCAL_DATABASE_URL || "postgresql://opentip:opentip@127.0.0.1:5432/postgres";

function localHost(url) {
  return /@(?:127\.0\.0\.1|localhost)(?::\d+)?\//.test(url);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!localHost(shadowUrl) || !localHost(adminUrl)) {
    console.error("Refusing to drift-check. The database URLs must target 127.0.0.1 or localhost.");
    process.exit(1);
  }
  const psql = (sql) => {
    execFileSync("psql", [adminUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], { stdio: ["ignore", "ignore", "inherit"] });
  };
  psql("DROP DATABASE IF EXISTS opentip_shadow WITH (FORCE)");
  psql("CREATE DATABASE opentip_shadow");
  const frontend = fileURLToPath(new URL("../frontend", import.meta.url));
  execFileSync(
    "npx",
    [
      "prisma",
      "migrate",
      "diff",
      "--from-migrations",
      "prisma/migrations",
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--shadow-database-url",
      shadowUrl,
      "--exit-code",
    ],
    { cwd: frontend, stdio: "inherit" },
  );
}
