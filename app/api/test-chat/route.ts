import { NextResponse } from "next/server";
import { handleUserMessage } from "@/lib/agent";
import { logger } from "@/lib/logger";
import { addDaysToSalonDate, todayInSalon } from "@/lib/timezone";

const HARDCODED_MESSAGE = "Yarın protez tırnak için müsait misiniz?";

export async function GET() {
  try {
    const sessionId = "test-chat";
    const result = await handleUserMessage(sessionId, HARDCODED_MESSAGE);
    const expectedDate = addDaysToSalonDate(todayInSalon(), 1);

    logger.info("test-chat completed", {
      tools: result.toolCalls,
      usedFallback: result.usedFallback,
      expectedDate,
    });

    return NextResponse.json({
      message: HARDCODED_MESSAGE,
      reply: result.reply,
      toolCalls: result.toolCalls,
      usedFallback: result.usedFallback,
      calledCheckAvailability: result.toolCalls.includes("checkAvailability"),
    });
  } catch (error) {
    logger.error("GET /api/test-chat failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "test-chat failed" }, { status: 500 });
  }
}
