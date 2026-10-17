// Every script that opens Prisma must call this before `new PrismaClient()`.
// A non-local DATABASE_URL exits here and is not printed.

const LOCAL_DATABASE_URL = /^postgres(?:ql)?:\/\/[^@]+@(?:127\.0\.0\.1|localhost)(?::\d+)?\//;

export function assertLocalDb(databaseUrl = process.env.DATABASE_URL || "") {
  if (!LOCAL_DATABASE_URL.test(databaseUrl)) {
    console.error("Refusing to seed. DATABASE_URL must target 127.0.0.1 or localhost.");
    process.exit(1);
  }
}
