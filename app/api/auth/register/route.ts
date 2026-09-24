import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { createAndSendEmailChallenge } from "@/lib/email-auth-challenge";
import { rejectIfCrossOrigin } from "@/lib/request-origin";
import { slugify } from "@/lib/slug";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  phone: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(160).optional().default(""),
  slug: z.string().trim().max(40).optional(),
  acceptedTerms: z.literal(true),
});

export async function POST(request: Request) {
  const blocked = rejectIfCrossOrigin(request);
  if (blocked) return blocked;

  try {
    const body = bodySchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const exists = await prisma.salon.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
    }

    const { challengeId, maskedEmail } = await createAndSendEmailChallenge({
      email,
      purpose: "register",
      payload: {
        name: body.name,
        passwordHash: await hashPassword(body.password),
        phone: body.phone,
        address: body.address,
        slugBase: slugify(body.slug || body.name),
      },
    });

    return NextResponse.json({
      ok: true,
      needsVerification: true,
      challengeId,
      maskedEmail,
      purpose: "register" as const,
    });
  } catch (error) {
    return toErrorResponse(error, {
      zodMessage:
        "Ad, geçerli e-posta, en az 8 karakter şifre ve kullanım şartları onayı gerekli.",
      fallbackMessage: "Kayıt başarısız.",
      logKey: "POST /api/auth/register failed",
    });
  }
}
