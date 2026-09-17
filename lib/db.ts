import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function assertPostgresUrl(): void {
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
