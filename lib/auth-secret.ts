/** Shared AUTH_SECRET resolution for Node (auth) and Edge (middleware). */

const DEV_FALLBACK = "dev-salon-ai-change-me-in-production";

export function resolveAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) {
      throw new Error("AUTH_SECRET is required in production");
    }
    return DEV_FALLBACK;
  }

  if (isProd && (secret.length < 32 || secret === DEV_FALLBACK || secret === "change-me-in-production")) {
    throw new Error("AUTH_SECRET must be a strong random value in production (min 32 chars)");
  }

  return secret;
}

export function authSecretKey(): Uint8Array {
  return new TextEncoder().encode(resolveAuthSecret());
}
