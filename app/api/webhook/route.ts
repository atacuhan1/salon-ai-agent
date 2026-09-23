import { NextResponse } from "next/server";
import { handleUserMessage } from "@/lib/agent";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  parseIncomingWhatsApp,
  sendWhatsAppText,
  verifyWhatsAppSignature,
} from "@/lib/whatsapp";

const FORBIDDEN_VERIFY_TOKENS = new Set([
  "salon-dev-verify",
  "replace-me-with-a-long-random-token",
  "change-me",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = getEnv().WHATSAPP_VERIFY_TOKEN?.trim();

  if (
    !expected ||
    FORBIDDEN_VERIFY_TOKENS.has(expected) ||
    (process.env.NODE_ENV === "production" && expected.length < 16)
  ) {
    logger.warn("WhatsApp webhook verification rejected: VERIFY_TOKEN not configured");
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (mode === "subscribe" && token === expected && challenge) {
    logger.info("WhatsApp webhook verified");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  logger.warn("WhatsApp webhook verification failed");
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 256_000) {
    return new NextResponse("Payload too large", { status: 413 });
  }

  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    logger.warn("WhatsApp signature mismatch");
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    logger.warn("WhatsApp payload was not JSON", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: true });
  }

  const incoming = parseIncomingWhatsApp(payload);
  if (!incoming) {
    return NextResponse.json({ ok: true });
  }

  try {
    const result = await handleUserMessage(incoming.from, incoming.text);
    await sendWhatsAppText(incoming.from, result.reply);
  } catch (error) {
    logger.error("WhatsApp message handling failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  return NextResponse.json({ ok: true });
}
