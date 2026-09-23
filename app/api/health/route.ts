import { NextResponse } from "next/server";
import { prisma, getDatabaseUrlStatus } from "@/lib/db";
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
    // Use a model call (same path as register/login), not $queryRaw through the lazy proxy.
    await prisma.salon.count();
    database = true;
  } catch (error) {
    database = false;
    databaseError =
      error instanceof Error ? error.message : "database_unavailable";
  }

  let providers = {
    openai: false,
    googleCalendar: false,
    supabase: false,
    whatsapp: false,
  };
  let timezone = "Europe/Istanbul";
  let envError: string | undefined;

  try {
    timezone = salonTimeZone();
    providers = {
      openai: hasOpenAIConfig(),
      googleCalendar: hasGoogleCalendarConfig(),
      supabase: hasSupabaseConfig(),
      whatsapp: hasWhatsAppSendConfig(),
    };
  } catch (error) {
    envError = error instanceof Error ? error.message : "env_parse_failed";
  }

  return NextResponse.json({
    ok: database && !envError,
    timezone,
    database,
    databaseError: database ? undefined : databaseError,
    envError,
    dbEnv: {
      hasDatabaseUrl: dbStatus.hasDatabaseUrl,
      hasPrefixedDatabaseUrl: dbStatus.hasPrefixedDatabaseUrl,
      relatedEnvKeys: dbStatus.relatedEnvKeys,
    },
    providers,
  });
}
