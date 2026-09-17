import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireOwner } from "@/lib/api-guard";
import { prisma } from "@/lib/db";

const hhmm = z
  .string()
  .transform((value) => value.slice(0, 5))
  .refine((value) => /^\d{2}:\d{2}$/.test(value));

const staffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  openTime: hhmm,
  closeTime: hhmm,
});

export async function GET() {
  try {
    const { salon } = await requireOwner({ allowExpired: true });
    return NextResponse.json({ staff: salon.staff });
  } catch (error) {
    return errorResponse(error) ?? NextResponse.json({ error: "Çalışanlar okunamadı." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { salon } = await requireOwner();
    const body = staffSchema.parse(await request.json());
    const created = await prisma.staffMember.create({
      data: {
        salonId: salon.id,
        name: body.name,
        weekdays: JSON.stringify(body.weekdays),
        openTime: body.openTime,
        closeTime: body.closeTime,
      },
    });
    return NextResponse.json({ staff: created });
  } catch (error) {
    return (
      errorResponse(error) ??
      (error instanceof z.ZodError
        ? NextResponse.json(
            { error: "İsim, çalışma günleri ve saatler gerekli." },
            { status: 400 },
          )
        : NextResponse.json({ error: "Çalışan eklenemedi." }, { status: 500 }))
    );
  }
}
