// Apply frontend/beta-db/001_beta_application.sql to BETA_DATABASE_URL.
// Refuses any host other than 127.0.0.1 or localhost. Does not read DATABASE_URL.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const LOCAL = /^postgres(?:ql)?:\/\/[^@]+@(?:127\.0\.0\.1|localhost)(?::\d+)?\//;
const url = process.env.BETA_DATABASE_URL || "";

if (!url) {
  console.error("BETA_DATABASE_URL is not set.");
  process.exit(1);
}
if (!LOCAL.test(url)) {
  console.error("Refusing to apply the beta schema. BETA_DATABASE_URL must target 127.0.0.1 or localhost.");
  console.error("On Neon, apply frontend/beta-db/001_beta_application.sql with psql yourself.");
  process.exit(1);
}

const sqlPath = join(dirname(fileURLToPath(import.meta.url)), "../beta-db/001_beta_application.sql");
const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
} finally {
  await client.end();
}
console.log("Applied beta schema to the local beta database.");
