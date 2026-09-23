import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Vercel Marketplace store was linked with envVarPrefix `database`,
 * so production may only expose `database_DATABASE_URL`. Map it for Prisma.
 *
 * Keep a static `process.env.database_*` reference so Vercel/Next include those
 * Marketplace vars in the serverless function environment, then copy via
 * bracket access for the Prisma engine.
 */
function resolveDatabaseUrl(): void {
  // Static refs for env inclusion (do not remove).
  const marketplaceUrl = process.env.database_DATABASE_URL;
  const marketplacePostgres = process.env.database_POSTGRES_URL;
  const marketplacePrisma = process.env.database_PRISMA_DATABASE_URL;

  const env = process.env;
  const prefixed =
    marketplaceUrl ||
    marketplacePostgres ||
    marketplacePrisma ||
    env["database_DATABASE_URL"] ||
    env["database_POSTGRES_URL"] ||
    env["database_PRISMA_DATABASE_URL"];

  if (!env.DATABASE_URL && prefixed) {
    env.DATABASE_URL = prefixed;
  }
}

export function getDatabaseUrlStatus(): {
  hasDatabaseUrl: boolean;
  hasPrefixedDatabaseUrl: boolean;
  relatedEnvKeys: string[];
} {
  resolveDatabaseUrl();
  const relatedEnvKeys = Object.keys(process.env)
    .filter((key) => /database|postgres|prisma/i.test(key))
    .sort();
  return {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPrefixedDatabaseUrl: Boolean(
      process.env.database_DATABASE_URL ||
        process.env["database_DATABASE_URL"],
    ),
    relatedEnvKeys,
  };
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

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    assertPostgresUrl();
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

/** @deprecated Prefer getPrisma() so import does not crash without DATABASE_URL. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
