import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const envSchema = z.object({
  OPENAI_API_KEY: optionalString,
  GOOGLE_CALENDAR_ID: optionalString,
  GOOGLE_CLIENT_EMAIL: optionalString,
  GOOGLE_PRIVATE_KEY: optionalString,
  SUPABASE_URL: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).default("salon-dev-verify"),
  WHATSAPP_ACCESS_TOKEN: optionalString,
  WHATSAPP_PHONE_NUMBER_ID: optionalString,
  WHATSAPP_APP_SECRET: optionalString,
  SALON_TIMEZONE: z.string().min(1).default("Europe/Istanbul"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OPENAI_MAX_TOKENS: z.coerce.number().int().min(64).max(1000).default(180),
  OPENAI_HISTORY_LIMIT: z.coerce.number().int().min(2).max(20).default(4),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) {
    return cached;
  }

  cached = envSchema.parse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    SALON_TIMEZONE: process.env.SALON_TIMEZONE,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS,
    OPENAI_HISTORY_LIMIT: process.env.OPENAI_HISTORY_LIMIT,
  });

  return cached;
}

export function hasGoogleCalendarConfig(): boolean {
  const env = getEnv();
  return Boolean(
    env.GOOGLE_CALENDAR_ID && env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY,
  );
}

export function hasOpenAIConfig(): boolean {
  return Boolean(getEnv().OPENAI_API_KEY);
}

export function hasSupabaseConfig(): boolean {
  const env = getEnv();
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasWhatsAppSendConfig(): boolean {
  const env = getEnv();
  return Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}
