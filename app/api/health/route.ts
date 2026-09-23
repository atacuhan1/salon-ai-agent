import { NextResponse } from "next/server";
import { prisma, getDatabaseUrlStatus } from "@/lib/db";
import { salonTimeZone } from "@/lib/timezone";

/**
 * Public health: minimal surface. Detailed diagnostics only when
 * HEALTH_DETAILS=1 (internal/ops), never dump env key lists by default.
 */
export async function GET() {
  let database = false;

  try {
    await prisma.salon.count();
    database = true;
  } catch {
    database = false;
  }

  const body: Record<string, unknown> = {
    ok: database,
    database,
    timezone: salonTimeZone(),
  };

  if (process.env.HEALTH_DETAILS === "1") {
    const dbStatus = getDatabaseUrlStatus();
    body.dbEnv = {
      hasDatabaseUrl: dbStatus.hasDatabaseUrl,
      hasPrefixedDatabaseUrl: dbStatus.hasPrefixedDatabaseUrl,
    };
  }

  return NextResponse.json(body);
}
