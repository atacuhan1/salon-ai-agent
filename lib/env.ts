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
  OPENAI_MAX_TOKENS: z.coerce.number().int().min(64).max(1000).default(220),
  OPENAI_HISTORY_LIMIT: z.coerce.number().int().min(2).max(20).default(4),
  AUTH_SECRET: optionalString,
  DATABASE_URL: optionalString,
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) {
    return cached;
  }

  const env = process.env;
  // Prefer canonical DATABASE_URL; fall back to Marketplace-prefixed store vars.
  const databaseUrl =
    env.DATABASE_URL ||
    env["database_DATABASE_URL"] ||
    env["database_POSTGRES_URL"];

  if (databaseUrl && !env.DATABASE_URL) {
    env.DATABASE_URL = databaseUrl;
  }

  cached = envSchema.parse({
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    GOOGLE_CALENDAR_ID: env.GOOGLE_CALENDAR_ID,
    GOOGLE_CLIENT_EMAIL: env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: env.GOOGLE_PRIVATE_KEY,
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    WHATSAPP_VERIFY_TOKEN: env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_ACCESS_TOKEN: env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_APP_SECRET: env.WHATSAPP_APP_SECRET,
    SALON_TIMEZONE: env.SALON_TIMEZONE,
    LOG_LEVEL: env.LOG_LEVEL,
    NODE_ENV: env.NODE_ENV,
    OPENAI_MODEL: env.OPENAI_MODEL,
    OPENAI_MAX_TOKENS: env.OPENAI_MAX_TOKENS,
    OPENAI_HISTORY_LIMIT: env.OPENAI_HISTORY_LIMIT,
    AUTH_SECRET: env.AUTH_SECRET,
    DATABASE_URL: databaseUrl,
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
