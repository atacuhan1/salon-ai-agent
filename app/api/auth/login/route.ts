import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const salon = await prisma.salon.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!salon || !(await verifyPassword(body.password, salon.passwordHash))) {
      return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
    }
    const token = await createSessionToken({
      salonId: salon.id,
      slug: salon.slug,
      email: salon.email,
    });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, slug: salon.slug });
  } catch (error) {
    logger.error("POST /api/auth/login failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
    }
    return NextResponse.json({ error: "Giriş başarısız." }, { status: 500 });
  }
}
