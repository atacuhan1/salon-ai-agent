import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { rejectIfCrossOrigin } from "@/lib/request-origin";
import { hhmm } from "@/lib/salon-schemas";

const hoursSchema = z.object({
  hours: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        closed: z.boolean(),
        openTime: hhmm.optional().nullable(),
        closeTime: hhmm.optional().nullable(),
      }),
    )
    .length(7),
});

export async function PUT(request: Request) {
  try {
    const blocked = rejectIfCrossOrigin(request);
    if (blocked) return blocked;
    const { salon } = await requireOwner();
    const body = hoursSchema.parse(await request.json());
    for (const row of body.hours) {
      await prisma.salonHour.upsert({
        where: { salonId_weekday: { salonId: salon.id, weekday: row.weekday } },
        update: {
          openTime: row.closed ? null : row.openTime ?? null,
          closeTime: row.closed ? null : row.closeTime ?? null,
        },
        create: {
          salonId: salon.id,
          weekday: row.weekday,
          openTime: row.closed ? null : row.openTime ?? null,
          closeTime: row.closed ? null : row.closeTime ?? null,
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, {
      zodMessage: "Saat bilgisi eksik.",
      fallbackMessage: "Saatler kaydedilemedi.",
    });
  }
}
