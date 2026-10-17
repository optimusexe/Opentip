const LOCAL_DATABASE_URL = /^postgres(?:ql)?:\/\/[^@]+@(?:127\.0\.0\.1|localhost)(?::\d+)?\//;

export function assertLocalDb(databaseUrl = process.env.DATABASE_URL || "") {
  if (!LOCAL_DATABASE_URL.test(databaseUrl)) {
    console.error("Refusing to seed. DATABASE_URL must target 127.0.0.1 or localhost.");
    process.exit(1);
  }
}
