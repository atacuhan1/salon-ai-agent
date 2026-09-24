import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleUserMessage, SalonAccessError } from "@/lib/agent";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  sessionId: z.string().min(3).max(64).optional(),
  message: z.string().min(1).max(2000),
  salonSlug: z.string().min(1).max(40).optional(),
});

/** Simple per-isolate rate limit (best-effort on serverless). */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 30;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (row.count >= MAX_HITS) {
    return false;
  }
  row.count += 1;
  return true;
}

function clientKey(request: Request, salonSlug?: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || "unknown";
  return `${ip}:${salonSlug ?? "default"}`;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);

    if (!rateLimit(clientKey(request, body.salonSlug))) {
      return NextResponse.json(
        { error: "Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin." },
        { status: 429 },
      );
    }

    // Prefer client session when present; otherwise mint an opaque id (do not use shared demo phones).
    const sessionId = body.sessionId?.trim() || randomUUID().replace(/-/g, "").slice(0, 24);
    const result = await handleUserMessage(sessionId, body.message, body.salonSlug);
    return NextResponse.json({
      reply: result.reply,
      toolCalls: result.toolCalls,
      usedFallback: result.usedFallback,
      sessionId,
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
      return NextResponse.json({ error: "Mesaj gönderilemedi. Lütfen tekrar deneyin." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Asistan şu an yanıt veremiyor. Lütfen biraz sonra tekrar deneyin." },
      { status: 500 },
    );
  }
}
