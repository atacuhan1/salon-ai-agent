import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { resolveAuthSecret } from "@/lib/auth-secret";

export const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
export const EMAIL_CODE_LENGTH = 6;
export const EMAIL_CODE_MAX_ATTEMPTS = 5;
/** Max new codes per email+purpose in the rolling window. */
export const EMAIL_CODE_RATE_LIMIT = 3;
export const EMAIL_CODE_RATE_WINDOW_MS = 15 * 60 * 1000;

export type EmailAuthPurpose = "login" | "register";

export function generateEmailCode(): string {
  const max = 10 ** EMAIL_CODE_LENGTH;
  return String(randomInt(0, max)).padStart(EMAIL_CODE_LENGTH, "0");
}

export function hashEmailCode(code: string, challengeId: string): string {
  const pepper = resolveAuthSecret();
  return createHash("sha256")
    .update(`${pepper}:${challengeId}:${normalizeCode(code)}`)
    .digest("hex");
}

export function normalizeCode(code: string): string {
  return code.replace(/\s+/g, "").trim();
}

export function codesMatch(codeHash: string, code: string, challengeId: string): boolean {
  const expected = Buffer.from(codeHash, "utf8");
  const actual = Buffer.from(hashEmailCode(code, challengeId), "utf8");
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function emailCodeExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + EMAIL_CODE_TTL_MS);
}

export function isEmailCodeExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return "***";
  }
  if (local.length <= 2) {
    return `${local[0] ?? "*"}***@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}
