import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { uniqueSlug } from "@/lib/salon-store";
import { rejectIfCrossOrigin } from "@/lib/request-origin";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(160).optional(),
  slug: z.string().trim().max(40).optional(),
  whatsappPhoneNumberId: z
    .string()
    .trim()
    .max(64)
    .regex(/^[0-9]*$/, "WhatsApp hat kimliği yalnızca rakam olmalı")
    .optional()
    .transform((value) => (value === "" ? null : value)),
  googleCalendarId: z
    .string()
    .trim()
    .max(256)
    .optional()
    .transform((value) => (value === "" ? null : value)),
});

export async function GET() {
  try {
    const { salon, access } = await requireOwner({ allowExpired: true });
    return NextResponse.json({
      salon: {
        id: salon.id,
        name: salon.name,
        slug: salon.slug,
        email: salon.email,
        phone: salon.phone,
        address: salon.address,
        whatsappPhoneNumberId: salon.whatsappPhoneNumberId,
        googleCalendarId: salon.googleCalendarId,
      },
      access,
    });
  } catch (error) {
    return toErrorResponse(error, {
      zodMessage: "Geçersiz istek.",
      fallbackMessage: "Salon okunamadı.",
    });
  }
}

export async function PUT(request: Request) {
  try {
    const blocked = rejectIfCrossOrigin(request);
    if (blocked) return blocked;
    const { salon } = await requireOwner();
    const body = updateSchema.parse(await request.json());
    const slug = body.slug
      ? await uniqueSlug(slugify(body.slug), salon.id)
      : undefined;

    if (body.whatsappPhoneNumberId) {
      const clash = await prisma.salon.findFirst({
        where: {
          whatsappPhoneNumberId: body.whatsappPhoneNumberId,
          NOT: { id: salon.id },
        },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { error: "Bu WhatsApp hat kimliği başka bir salona kayıtlı." },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.salon.update({
      where: { id: salon.id },
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        slug,
        ...(body.whatsappPhoneNumberId !== undefined
          ? { whatsappPhoneNumberId: body.whatsappPhoneNumberId }
          : {}),
        ...(body.googleCalendarId !== undefined
          ? { googleCalendarId: body.googleCalendarId }
          : {}),
      },
    });
    return NextResponse.json({ ok: true, slug: updated.slug });
  } catch (error) {
    return toErrorResponse(error, {
      zodMessage: "Geçersiz salon bilgisi.",
      fallbackMessage: "Güncellenemedi.",
      logKey: "PUT /api/salon failed",
    });
  }
}
