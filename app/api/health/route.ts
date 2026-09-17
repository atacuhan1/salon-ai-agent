import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hasGoogleCalendarConfig,
  hasOpenAIConfig,
  hasSupabaseConfig,
  hasWhatsAppSendConfig,
} from "@/lib/env";
import { salonTimeZone } from "@/lib/timezone";

export async function GET() {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  return NextResponse.json({
    ok: database,
    timezone: salonTimeZone(),
    database,
    providers: {
      openai: hasOpenAIConfig(),
      googleCalendar: hasGoogleCalendarConfig(),
      supabase: hasSupabaseConfig(),
      whatsapp: hasWhatsAppSendConfig(),
    },
  });
}
