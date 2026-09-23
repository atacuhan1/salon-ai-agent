import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { rejectIfCrossOrigin } from "@/lib/request-origin";
import { hhmm } from "@/lib/salon-schemas";

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
    const blocked = rejectIfCrossOrigin(request);
    if (blocked) return blocked;
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
    return toErrorResponse(error, {
      zodMessage: "Geçersiz çalışan bilgisi.",
      fallbackMessage: "Güncellenemedi.",
    });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const blocked = rejectIfCrossOrigin(request);
    if (blocked) return blocked;
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
    return toErrorResponse(error, {
      zodMessage: "Geçersiz istek.",
      fallbackMessage: "Silinemedi.",
    });
  }
}
