import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, toErrorResponse } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { rejectIfCrossOrigin } from "@/lib/request-origin";
import { hhmm } from "@/lib/salon-schemas";

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
    return toErrorResponse(error, {
      zodMessage: "Geçersiz istek.",
      fallbackMessage: "Çalışanlar okunamadı.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const blocked = rejectIfCrossOrigin(request);
    if (blocked) return blocked;
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
    return toErrorResponse(error, {
      zodMessage: "İsim, çalışma günleri ve saatler gerekli.",
      fallbackMessage: "Çalışan eklenemedi.",
    });
  }
}
