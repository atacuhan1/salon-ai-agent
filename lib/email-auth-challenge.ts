import { randomUUID } from "node:crypto";
import { z } from "zod";
import { HttpError } from "@/lib/api-guard";
import {
  EMAIL_CODE_MAX_ATTEMPTS,
  EMAIL_CODE_RATE_LIMIT,
  EMAIL_CODE_RATE_WINDOW_MS,
  codesMatch,
  emailCodeExpiresAt,
  generateEmailCode,
  hashEmailCode,
  isEmailCodeExpired,
  maskEmail,
  normalizeCode,
  type EmailAuthPurpose,
} from "@/lib/email-code";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const registerPayloadSchema = z.object({
  name: z.string().min(2).max(80),
  passwordHash: z.string().min(20),
  phone: z.string().max(30),
  address: z.string().max(160),
  slugBase: z.string().min(1).max(80),
});

const loginPayloadSchema = z.object({
  salonId: z.string().min(1),
});

export type RegisterChallengePayload = z.infer<typeof registerPayloadSchema>;
export type LoginChallengePayload = z.infer<typeof loginPayloadSchema>;

export async function assertEmailCodeRateLimit(
  email: string,
  purpose: EmailAuthPurpose,
): Promise<void> {
  const since = new Date(Date.now() - EMAIL_CODE_RATE_WINDOW_MS);
  const recent = await prisma.emailAuthChallenge.count({
    where: {
      email,
      purpose,
      createdAt: { gte: since },
    },
  });
  if (recent >= EMAIL_CODE_RATE_LIMIT) {
    throw new HttpError(
      429,
      "Çok fazla kod istendi. Lütfen birkaç dakika sonra tekrar deneyin.",
    );
  }
}

export async function createAndSendEmailChallenge(input: {
  email: string;
  purpose: EmailAuthPurpose;
  payload: RegisterChallengePayload | LoginChallengePayload;
}): Promise<{ challengeId: string; maskedEmail: string }> {
  await assertEmailCodeRateLimit(input.email, input.purpose);

  if (input.purpose === "register") {
    registerPayloadSchema.parse(input.payload);
  } else {
    loginPayloadSchema.parse(input.payload);
  }

  await prisma.emailAuthChallenge.updateMany({
    where: {
      email: input.email,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { consumedAt: new Date() },
  });

  const challengeId = randomUUID();
  const code = generateEmailCode();
  const codeHash = hashEmailCode(code, challengeId);

  await prisma.emailAuthChallenge.create({
    data: {
      id: challengeId,
      email: input.email,
      purpose: input.purpose,
      codeHash,
      payloadJson: JSON.stringify(input.payload),
      expiresAt: emailCodeExpiresAt(),
    },
  });

  try {
    await sendVerificationEmail({
      to: input.email,
      code,
      purpose: input.purpose,
    });
  } catch (error) {
    await prisma.emailAuthChallenge.update({
      where: { id: challengeId },
      data: { consumedAt: new Date() },
    });
    throw error;
  }

  logger.info("Email auth challenge created", {
    purpose: input.purpose,
    challengeId,
  });

  return { challengeId, maskedEmail: maskEmail(input.email) };
}

export async function consumeEmailChallenge(input: {
  challengeId: string;
  code: string;
  purpose: EmailAuthPurpose;
}): Promise<{
  email: string;
  purpose: EmailAuthPurpose;
  payload: RegisterChallengePayload | LoginChallengePayload;
}> {
  const code = normalizeCode(input.code);
  if (!/^\d{6}$/.test(code)) {
    throw new HttpError(400, "Kod 6 haneli olmalıdır.");
  }

  const challenge = await prisma.emailAuthChallenge.findUnique({
    where: { id: input.challengeId },
  });
  if (!challenge || challenge.purpose !== input.purpose) {
    throw new HttpError(400, "Doğrulama oturumu bulunamadı. Tekrar deneyin.");
  }
  if (challenge.consumedAt) {
    throw new HttpError(400, "Bu kod zaten kullanıldı. Yeni kod isteyin.");
  }
  if (isEmailCodeExpired(challenge.expiresAt)) {
    throw new HttpError(400, "Kodun süresi doldu. Yeni kod isteyin.");
  }
  if (challenge.attemptCount >= EMAIL_CODE_MAX_ATTEMPTS) {
    throw new HttpError(429, "Çok fazla hatalı deneme. Yeni kod isteyin.");
  }

  if (!codesMatch(challenge.codeHash, code, challenge.id)) {
    await prisma.emailAuthChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } },
    });
    throw new HttpError(401, "Kod hatalı.");
  }

  const consumed = await prisma.emailAuthChallenge.updateMany({
    where: {
      id: challenge.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) {
    throw new HttpError(400, "Bu kod zaten kullanıldı. Yeni kod isteyin.");
  }

  const payload =
    challenge.purpose === "register"
      ? registerPayloadSchema.parse(JSON.parse(challenge.payloadJson))
      : loginPayloadSchema.parse(JSON.parse(challenge.payloadJson));

  return {
    email: challenge.email,
    purpose: challenge.purpose as EmailAuthPurpose,
    payload,
  };
}

export function parseRegisterPayload(
  payload: RegisterChallengePayload | LoginChallengePayload,
): RegisterChallengePayload {
  return registerPayloadSchema.parse(payload);
}

export function parseLoginPayload(
  payload: RegisterChallengePayload | LoginChallengePayload,
): LoginChallengePayload {
  return loginPayloadSchema.parse(payload);
}
