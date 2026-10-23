import pg from "pg";

// Beta applications live in their own database. This module never reads
// DATABASE_URL, so a missing BETA_DATABASE_URL cannot fall through to the
// tipping database.

let pool: pg.Pool | null = null;

export function betaDatabaseConfigured(): boolean {
  return Boolean(process.env.BETA_DATABASE_URL);
}

export function getBetaPool(): pg.Pool {
  const connectionString = process.env.BETA_DATABASE_URL;
  if (!connectionString) {
    throw new Error("BETA_DATABASE_URL is not set");
  }
  if (!pool) {
    const local = /@(?:127\.0\.0\.1|localhost)(?::\d+)?\//.test(connectionString);
    pool = new pg.Pool({
      connectionString,
      max: 3,
      connectionTimeoutMillis: 5000,
      ssl: local ? undefined : { rejectUnauthorized: true },
    });
  }
  return pool;
}

export function safeDbError(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown";
  if (message.includes("://") || /password/i.test(message)) return "database error";
  return message;
}
