import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { createAndSendEmailChallenge } from "@/lib/email-auth-challenge";
import { rejectIfCrossOrigin } from "@/lib/request-origin";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const blocked = rejectIfCrossOrigin(request);
  if (blocked) return blocked;

  try {
    const body = bodySchema.parse(await request.json());
    const salon = await prisma.salon.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!salon || !(await verifyPassword(body.password, salon.passwordHash))) {
      return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
    }

    const { challengeId, maskedEmail } = await createAndSendEmailChallenge({
      email: salon.email,
      purpose: "login",
      payload: { salonId: salon.id },
    });

    return NextResponse.json({
      ok: true,
      needsVerification: true,
      challengeId,
      maskedEmail,
      purpose: "login" as const,
    });
  } catch (error) {
    return toErrorResponse(error, {
      zodMessage: "E-posta ve şifre gerekli.",
      fallbackMessage: "Giriş başarısız.",
      logKey: "POST /api/auth/login failed",
    });
  }
}
