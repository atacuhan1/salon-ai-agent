import assert from "node:assert/strict";
import { test } from "node:test";
import { HttpError } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import {
  consumeEmailChallenge,
} from "@/lib/email-auth-challenge";
import {
  EMAIL_CODE_MAX_ATTEMPTS,
  emailCodeExpiresAt,
  hashEmailCode,
} from "@/lib/email-code";

test("consumeEmailChallenge accepts once then rejects reuse", async () => {
  const challengeId = crypto.randomUUID();
  const code = "918273";
  const email = `otp-once-${Date.now()}@example.com`;
  await prisma.emailAuthChallenge.create({
    data: {
      id: challengeId,
      email,
      purpose: "login",
      codeHash: hashEmailCode(code, challengeId),
      payloadJson: JSON.stringify({ salonId: "salon-test" }),
      expiresAt: emailCodeExpiresAt(),
    },
  });

  const first = await consumeEmailChallenge({
    challengeId,
    code,
    purpose: "login",
  });
  assert.equal(first.email, email);
  assert.equal(first.purpose, "login");

  await assert.rejects(
    () =>
      consumeEmailChallenge({
        challengeId,
        code,
        purpose: "login",
      }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 400 &&
      /kullanıldı/i.test(error.message),
  );
});

test("consumeEmailChallenge rejects wrong code and counts attempts", async () => {
  const challengeId = crypto.randomUUID();
  const code = "555666";
  const email = `otp-wrong-${Date.now()}@example.com`;
  await prisma.emailAuthChallenge.create({
    data: {
      id: challengeId,
      email,
      purpose: "register",
      codeHash: hashEmailCode(code, challengeId),
      payloadJson: JSON.stringify({
        name: "Test Salon",
        passwordHash: "x".repeat(30),
        phone: "",
        address: "",
        slugBase: "test-salon",
      }),
      expiresAt: emailCodeExpiresAt(),
    },
  });

  await assert.rejects(
    () =>
      consumeEmailChallenge({
        challengeId,
        code: "000000",
        purpose: "register",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 401,
  );

  const row = await prisma.emailAuthChallenge.findUniqueOrThrow({
    where: { id: challengeId },
  });
  assert.equal(row.attemptCount, 1);
  assert.equal(row.consumedAt, null);
});

test("consumeEmailChallenge rejects expired codes", async () => {
  const challengeId = crypto.randomUUID();
  const code = "111222";
  await prisma.emailAuthChallenge.create({
    data: {
      id: challengeId,
      email: `otp-exp-${Date.now()}@example.com`,
      purpose: "login",
      codeHash: hashEmailCode(code, challengeId),
      payloadJson: JSON.stringify({ salonId: "salon-exp" }),
      expiresAt: new Date(Date.now() - 1000),
    },
  });

  await assert.rejects(
    () =>
      consumeEmailChallenge({
        challengeId,
        code,
        purpose: "login",
      }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 400 &&
      /süresi doldu/i.test(error.message),
  );
});

test("consumeEmailChallenge locks after max attempts", async () => {
  const challengeId = crypto.randomUUID();
  const code = "333444";
  await prisma.emailAuthChallenge.create({
    data: {
      id: challengeId,
      email: `otp-lock-${Date.now()}@example.com`,
      purpose: "login",
      codeHash: hashEmailCode(code, challengeId),
      payloadJson: JSON.stringify({ salonId: "salon-lock" }),
      expiresAt: emailCodeExpiresAt(),
      attemptCount: EMAIL_CODE_MAX_ATTEMPTS,
    },
  });

  await assert.rejects(
    () =>
      consumeEmailChallenge({
        challengeId,
        code,
        purpose: "login",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 429,
  );
});
