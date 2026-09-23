import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Vercel Marketplace store was linked with envVarPrefix `database`,
 * so production may only expose `database_DATABASE_URL`. Map it for Prisma.
 */
function resolveDatabaseUrl(): void {
  if (!process.env.DATABASE_URL && process.env.database_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.database_DATABASE_URL;
  }
}

function assertPostgresUrl(): void {
  resolveDatabaseUrl();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL gerekli. Postgres bağlantı dizesi kullanın (SQLite artık yok).",
    );
  }
  if (url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL SQLite dosyası olamaz. postgresql://... kullanın.",
    );
  }
}

assertPostgresUrl();

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
