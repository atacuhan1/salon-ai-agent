import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireOwner } from "@/lib/api-guard";
import { prisma } from "@/lib/db";

const hhmm = z
  .string()
  .transform((value) => value.slice(0, 5))
  .refine((value) => /^\d{2}:\d{2}$/.test(value));

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).optional(),
  openTime: hhmm.optional(),
  closeTime: hhmm.optional(),
  active: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { salon } = await requireOwner();
    const { id } = await context.params;
    if (!salon.staff.some((member) => member.id === id)) {
      return NextResponse.json({ error: "Çalışan bulunamadı." }, { status: 404 });
    }
    const body = updateSchema.parse(await request.json());
    const updated = await prisma.staffMember.updateMany({
      where: { id, salonId: salon.id },
      data: {
        name: body.name,
        weekdays: body.weekdays ? JSON.stringify(body.weekdays) : undefined,
        openTime: body.openTime,
        closeTime: body.closeTime,
        active: body.active,
      },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Çalışan bulunamadı." }, { status: 404 });
    }
    const staff = await prisma.staffMember.findFirst({
      where: { id, salonId: salon.id },
    });
    return NextResponse.json({ staff });
  } catch (error) {
    return (
      errorResponse(error) ??
      (error instanceof z.ZodError
        ? NextResponse.json({ error: "Geçersiz çalışan bilgisi." }, { status: 400 })
        : NextResponse.json({ error: "Güncellenemedi." }, { status: 500 }))
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
    if (!salon.staff.some((member) => member.id === id)) {
      return NextResponse.json({ error: "Çalışan bulunamadı." }, { status: 404 });
    }
    const deleted = await prisma.staffMember.deleteMany({
      where: { id, salonId: salon.id },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Çalışan bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error) ?? NextResponse.json({ error: "Silinemedi." }, { status: 500 });
  }
}
