import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";

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
    return toErrorResponse(error, {
      zodMessage: "E-posta ve şifre gerekli.",
      fallbackMessage: "Giriş başarısız.",
      logKey: "POST /api/auth/login failed",
    });
  }
}
