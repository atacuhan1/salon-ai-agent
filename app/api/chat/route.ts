import { NextResponse } from "next/server";
import { z } from "zod";
import { handleUserMessage, SalonAccessError } from "@/lib/agent";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  sessionId: z.string().min(3).max(32).default("905551234567"),
  message: z.string().min(1).max(2000),
  salonSlug: z.string().min(1).max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);
    const result = await handleUserMessage(body.sessionId, body.message, body.salonSlug);
    return NextResponse.json({
      reply: result.reply,
      toolCalls: result.toolCalls,
      usedFallback: result.usedFallback,
    });
  } catch (error) {
    logger.error("POST /api/chat failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    if (error instanceof SalonAccessError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "expired" ? 402 : 404 },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid chat payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
