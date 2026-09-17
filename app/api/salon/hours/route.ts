import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireOwner } from "@/lib/api-guard";
import { prisma } from "@/lib/db";

const hhmm = z
  .string()
  .transform((value) => value.slice(0, 5))
  .refine((value) => /^\d{2}:\d{2}$/.test(value));

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
    return (
      errorResponse(error) ??
      (error instanceof z.ZodError
        ? NextResponse.json({ error: "Saat bilgisi eksik." }, { status: 400 })
        : NextResponse.json({ error: "Saatler kaydedilemedi." }, { status: 500 }))
    );
  }
}
