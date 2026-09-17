import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/slug";
import { seedSalonDefaults, uniqueSlug } from "@/lib/salon-store";
import { trialEndsFrom } from "@/lib/subscription";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  phone: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(160).optional().default(""),
  slug: z.string().trim().max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const exists = await prisma.salon.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
    }

    const slug = await uniqueSlug(slugify(body.slug || body.name));
    const salon = await prisma.salon.create({
      data: {
        name: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        phone: body.phone,
        address: body.address,
        slug,
        subscriptionStatus: "trial",
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
  } catch (error) {
    logger.error("POST /api/auth/register failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ad, geçerli e-posta ve en az 8 karakter şifre gerekli." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Kayıt başarısız." }, { status: 500 });
  }
}
