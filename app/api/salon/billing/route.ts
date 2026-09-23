import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { rejectIfCrossOrigin } from "@/lib/request-origin";
import { paidUntilFrom, SUBSCRIPTION_STATUS } from "@/lib/subscription";

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
          subscriptionStatus: SUBSCRIPTION_STATUS.active,
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
      data: { subscriptionStatus: SUBSCRIPTION_STATUS.canceled },
    });
    return NextResponse.json({
      ok: true,
      status: updated.subscriptionStatus,
    });
  } catch (error) {
    return toErrorResponse(error, {
      zodMessage: "Geçersiz istek.",
      fallbackMessage: "Abonelik güncellenemedi.",
    });
  }
}
