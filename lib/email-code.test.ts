import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMAIL_CODE_TTL_MS,
  codesMatch,
  emailCodeExpiresAt,
  generateEmailCode,
  hashEmailCode,
  isEmailCodeExpired,
  maskEmail,
  normalizeCode,
} from "@/lib/email-code";

test("generateEmailCode returns a 6-digit string", () => {
  for (let i = 0; i < 20; i += 1) {
    const code = generateEmailCode();
    assert.match(code, /^\d{6}$/);
  }
});

test("hashEmailCode is stable and does not equal plaintext", () => {
  const challengeId = "challenge-test-id";
  const code = "123456";
  const hash = hashEmailCode(code, challengeId);
  assert.notEqual(hash, code);
  assert.equal(hash, hashEmailCode(code, challengeId));
  assert.notEqual(hash, hashEmailCode("654321", challengeId));
  assert.notEqual(hash, hashEmailCode(code, "other-id"));
});

test("codesMatch accepts correct code and rejects wrong code", () => {
  const challengeId = "match-id";
  const code = "042891";
  const hash = hashEmailCode(code, challengeId);
  assert.equal(codesMatch(hash, code, challengeId), true);
  assert.equal(codesMatch(hash, "000000", challengeId), false);
  assert.equal(codesMatch(hash, " 042891 ", challengeId), true);
});

test("normalizeCode strips whitespace", () => {
  assert.equal(normalizeCode(" 12 34 56 "), "123456");
});

test("email code expiry is ~10 minutes", () => {
  const from = new Date("2026-01-01T12:00:00.000Z");
  const expires = emailCodeExpiresAt(from);
  assert.equal(expires.getTime() - from.getTime(), EMAIL_CODE_TTL_MS);
  assert.equal(isEmailCodeExpired(expires, from), false);
  assert.equal(isEmailCodeExpired(expires, new Date(expires.getTime())), true);
  assert.equal(
    isEmailCodeExpired(expires, new Date(expires.getTime() + 1)),
    true,
  );
});

test("maskEmail hides most of the local part", () => {
  assert.equal(maskEmail("ata@example.com"), "at***@example.com");
  assert.equal(maskEmail("a@example.com"), "a***@example.com");
});
