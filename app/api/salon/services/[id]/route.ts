import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireOwner } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { keywordsFromName } from "@/lib/salon-catalog";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  durationMinutes: z.coerce.number().int().min(10).max(480).optional(),
  priceTry: z.coerce.number().int().min(0).max(100000).optional(),
  keywords: z.string().trim().max(200).optional(),
  active: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { salon } = await requireOwner();
    const { id } = await context.params;
    const existing = salon.services.find((service) => service.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Hizmet bulunamadı." }, { status: 404 });
    }
    const body = updateSchema.parse(await request.json());
    const extra = body.keywords
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const updated = await prisma.service.update({
      where: { id },
      data: {
        name: body.name,
        durationMinutes: body.durationMinutes,
        priceTry: body.priceTry,
        active: body.active,
        keywords:
          body.name || extra
            ? JSON.stringify(keywordsFromName(body.name ?? existing.name, extra ?? []))
            : undefined,
      },
    });
    return NextResponse.json({ service: updated });
  } catch (error) {
    return (
      errorResponse(error) ??
      (error instanceof z.ZodError
        ? NextResponse.json({ error: "Geçersiz hizmet." }, { status: 400 })
        : NextResponse.json({ error: "Hizmet güncellenemedi." }, { status: 500 }))
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { salon } = await requireOwner();
    const { id } = await context.params;
    if (!salon.services.some((service) => service.id === id)) {
      return NextResponse.json({ error: "Hizmet bulunamadı." }, { status: 404 });
    }
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error) ?? NextResponse.json({ error: "Silinemedi." }, { status: 500 });
  }
}
