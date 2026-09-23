import { NextResponse } from "next/server";
import { getDatabaseUrlStatus, getPrisma } from "@/lib/db";
import {
  hasGoogleCalendarConfig,
  hasOpenAIConfig,
  hasSupabaseConfig,
  hasWhatsAppSendConfig,
} from "@/lib/env";
import { salonTimeZone } from "@/lib/timezone";

export async function GET() {
  const dbStatus = getDatabaseUrlStatus();
  let database = false;
  let databaseError: string | undefined;

  try {
    await getPrisma().$queryRaw`SELECT 1`;
    database = true;
  } catch (error) {
    database = false;
    databaseError =
      error instanceof Error ? error.message : "database_unavailable";
  }

  return NextResponse.json({
    ok: database,
    timezone: salonTimeZone(),
    database,
    databaseError: database ? undefined : databaseError,
    dbEnv: {
      hasDatabaseUrl: dbStatus.hasDatabaseUrl,
      hasPrefixedDatabaseUrl: dbStatus.hasPrefixedDatabaseUrl,
      relatedEnvKeys: dbStatus.relatedEnvKeys,
    },
    providers: {
      openai: hasOpenAIConfig(),
      googleCalendar: hasGoogleCalendarConfig(),
      supabase: hasSupabaseConfig(),
      whatsapp: hasWhatsAppSendConfig(),
    },
  });
}
