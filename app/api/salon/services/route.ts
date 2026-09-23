import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireOwner } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { keywordsFromName } from "@/lib/salon-catalog";
import { rejectIfCrossOrigin } from "@/lib/request-origin";

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  durationMinutes: z.coerce.number().int().min(10).max(480),
  priceTry: z.coerce.number().int().min(0).max(100000),
  keywords: z.string().trim().max(200).optional().default(""),
});

export async function GET() {
  try {
    const { salon } = await requireOwner({ allowExpired: true });
    return NextResponse.json({ services: salon.services });
  } catch (error) {
    return errorResponse(error) ?? NextResponse.json({ error: "Hizmetler okunamadı." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const blocked = rejectIfCrossOrigin(request);
    if (blocked) return blocked;
    const { salon } = await requireOwner();
    const body = serviceSchema.parse(await request.json());
    const extra = body.keywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const created = await prisma.service.create({
      data: {
        salonId: salon.id,
        name: body.name,
        durationMinutes: body.durationMinutes,
        priceTry: body.priceTry,
        keywords: JSON.stringify(keywordsFromName(body.name, extra)),
        sortOrder: salon.services.length,
      },
    });
    return NextResponse.json({ service: created });
  } catch (error) {
    return (
      errorResponse(error) ??
      (error instanceof z.ZodError
        ? NextResponse.json({ error: "Hizmet adı, süre ve ücret gerekli." }, { status: 400 })
        : NextResponse.json({ error: "Hizmet eklenemedi." }, { status: 500 }))
    );
  }
}
