import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import {
  consumeEmailChallenge,
  parseLoginPayload,
  parseRegisterPayload,
} from "@/lib/email-auth-challenge";
import { rejectIfCrossOrigin } from "@/lib/request-origin";
import { seedSalonDefaults, uniqueSlug } from "@/lib/salon-store";
import { SUBSCRIPTION_STATUS, trialEndsFrom } from "@/lib/subscription";

const bodySchema = z.object({
  challengeId: z.string().trim().min(1).max(80),
  code: z.string().trim().min(4).max(12),
  purpose: z.enum(["login", "register"]),
});

export async function POST(request: Request) {
  const blocked = rejectIfCrossOrigin(request);
  if (blocked) return blocked;

  try {
    const body = bodySchema.parse(await request.json());
    const result = await consumeEmailChallenge({
      challengeId: body.challengeId,
      code: body.code,
      purpose: body.purpose,
    });

    if (result.purpose === "register") {
      const payload = parseRegisterPayload(result.payload);
      const exists = await prisma.salon.findUnique({
        where: { email: result.email },
      });
      if (exists) {
        return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
      }

      const slug = await uniqueSlug(payload.slugBase);
      const salon = await prisma.salon.create({
        data: {
          name: payload.name,
          email: result.email,
          passwordHash: payload.passwordHash,
          phone: payload.phone,
          address: payload.address,
          slug,
          subscriptionStatus: SUBSCRIPTION_STATUS.trial,
          trialEndsAt: trialEndsFrom(),
        },
      });
      await seedSalonDefaults(salon.id);
      const token = await createSessionToken({
        salonId: salon.id,
        slug: salon.slug,
        email: salon.email,
      });
      await setSessionCookie(token);
      return NextResponse.json({ ok: true, slug: salon.slug });
    }

    const payload = parseLoginPayload(result.payload);
    const salon = await prisma.salon.findUnique({
      where: { id: payload.salonId },
    });
    if (!salon || salon.email !== result.email) {
      return NextResponse.json(
        { error: "Doğrulama oturumu geçersiz. Tekrar giriş yapın." },
        { status: 400 },
      );
    }

    const token = await createSessionToken({
      salonId: salon.id,
      slug: salon.slug,
      email: salon.email,
    });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, slug: salon.slug });
  } catch (error) {
    return toErrorResponse(error, {
      zodMessage: "Doğrulama kodu gerekli.",
      fallbackMessage: "Doğrulama başarısız.",
      logKey: "POST /api/auth/verify-email failed",
    });
  }
}
