import { NextResponse } from "next/server";
import {
  hasGoogleCalendarConfig,
  hasOpenAIConfig,
  hasSupabaseConfig,
  hasWhatsAppSendConfig,
} from "@/lib/env";
import { salonTimeZone } from "@/lib/timezone";

export async function GET() {
  return NextResponse.json({
    ok: true,
    timezone: salonTimeZone(),
    providers: {
      openai: hasOpenAIConfig(),
      googleCalendar: hasGoogleCalendarConfig(),
      supabase: hasSupabaseConfig(),
      whatsapp: hasWhatsAppSendConfig(),
    },
  });
}
