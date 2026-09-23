import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireOwner } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { paidUntilFrom } from "@/lib/subscription";
import { rejectIfCrossOrigin } from "@/lib/request-origin";

const bodySchema = z.object({
  action: z.enum(["activate", "cancel"]),
});

function billingSimulationEnabled(): boolean {
  if (process.env.BILLING_SIMULATION === "1") {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  try {
    const blocked = rejectIfCrossOrigin(request);
    if (blocked) return blocked;
    const { salon } = await requireOwner({ allowExpired: true });
    const body = bodySchema.parse(await request.json());
    if (body.action === "activate") {
      if (!billingSimulationEnabled()) {
        return NextResponse.json(
          {
            error:
              "Simüle abonelik production'da kapalı. Ödeme sağlayıcısı bağlanınca aktifleşecek.",
          },
          { status: 403 },
        );
      }
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
