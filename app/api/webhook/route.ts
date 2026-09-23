import { NextResponse } from "next/server";
import { handleUserMessage, SalonAccessError } from "@/lib/agent";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { loadSalonByWhatsAppPhoneNumberId } from "@/lib/salon-store";
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

  if (!incoming.phoneNumberId) {
    logger.warn("WhatsApp message missing metadata.phone_number_id; cannot route to salon");
    return NextResponse.json({ ok: true });
  }

  const mapped = await loadSalonByWhatsAppPhoneNumberId(incoming.phoneNumberId);
  if (!mapped) {
    logger.warn("No salon mapped to WhatsApp phone_number_id", {
      phoneNumberId: incoming.phoneNumberId,
    });
    try {
      await sendWhatsAppText(
        incoming.from,
        "Bu WhatsApp hattı henüz bir salona bağlanmamış. Salon paneli → Özet bölümünden Meta phone_number_id değerini kaydedin.",
        { phoneNumberId: incoming.phoneNumberId },
      );
    } catch {
      // Best-effort notice; still ack Meta.
    }
    return NextResponse.json({ ok: true });
  }

  if (!mapped.accessActive) {
    try {
      await sendWhatsAppText(
        incoming.from,
        "Bu salonun aboneliği aktif değil. Randevu asistanı kapalı.",
        { phoneNumberId: incoming.phoneNumberId },
      );
    } catch {
      // ignore
    }
    return NextResponse.json({ ok: true });
  }

  try {
    const result = await handleUserMessage(
      incoming.from,
      incoming.text,
      mapped.catalog.slug,
    );
    await sendWhatsAppText(incoming.from, result.reply, {
      phoneNumberId: incoming.phoneNumberId,
    });
  } catch (error) {
    if (error instanceof SalonAccessError) {
      try {
        await sendWhatsAppText(incoming.from, error.message, {
          phoneNumberId: incoming.phoneNumberId,
        });
      } catch {
        // ignore
      }
    } else {
      logger.error("WhatsApp message handling failed", {
        error: error instanceof Error ? error.message : "unknown",
        salonSlug: mapped.catalog.slug,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
