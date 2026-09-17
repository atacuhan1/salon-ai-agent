import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireOwner } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { paidUntilFrom } from "@/lib/subscription";

const bodySchema = z.object({
  action: z.enum(["activate", "cancel"]),
});

export async function POST(request: Request) {
  try {
    const { salon } = await requireOwner({ allowExpired: true });
    const body = bodySchema.parse(await request.json());
    if (body.action === "activate") {
      const paidUntil = paidUntilFrom();
      const updated = await prisma.salon.update({
        where: { id: salon.id },
        data: {
          subscriptionStatus: "active",
          paidUntil,
        },
      });
      return NextResponse.json({
        ok: true,
        status: updated.subscriptionStatus,
        paidUntil: updated.paidUntil,
      });
    }

    const updated = await prisma.salon.update({
      where: { id: salon.id },
      data: { subscriptionStatus: "canceled" },
    });
    return NextResponse.json({
      ok: true,
      status: updated.subscriptionStatus,
    });
  } catch (error) {
    return (
      errorResponse(error) ??
      (error instanceof z.ZodError
        ? NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
        : NextResponse.json({ error: "Abonelik güncellenemedi." }, { status: 500 }))
    );
  }
}
