import { refuseUnlessLocalDatabase } from "../.cursor/skills/verify-opentip/local-database.mjs";

refuseUnlessLocalDatabase();

const { PrismaClient } = await import("@prisma/client");
const p = new PrismaClient();
await p.indexerState.update({
  where: { id: "singleton" },
  data: { last_block: 51481885 },
});
await p.tip.deleteMany();
console.log("Reset last_block to 51481885 and cleared all tips");
await p.$disconnect();
