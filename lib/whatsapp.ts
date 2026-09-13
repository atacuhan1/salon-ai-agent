import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getEnv, hasWhatsAppSendConfig } from "@/lib/env";
import { logger } from "@/lib/logger";

const textMessageSchema = z.object({
  from: z.string().min(5),
  id: z.string(),
  timestamp: z.string().optional(),
  type: z.literal("text"),
  text: z.object({
    body: z.string().min(1),
  }),
});

const changeValueSchema = z.object({
  messaging_product: z.string().optional(),
  messages: z.array(z.unknown()).optional(),
  statuses: z.array(z.unknown()).optional(),
});

const webhookSchema = z.object({
  object: z.string().optional(),
  entry: z
    .array(
      z.object({
        changes: z
          .array(
            z.object({
              field: z.string().optional(),
              value: changeValueSchema,
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

export interface IncomingWhatsAppMessage {
  from: string;
  messageId: string;
  text: string;
}

export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = getEnv().WHATSAPP_APP_SECRET;
  if (!secret) {
    logger.warn("WHATSAPP_APP_SECRET missing; skipping signature check");
    return true;
  }
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function parseIncomingWhatsApp(payload: unknown): IncomingWhatsAppMessage | null {
  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) {
    logger.warn("Rejected WhatsApp payload", { issues: parsed.error.issues.length });
    return null;
  }

  for (const entry of parsed.data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const raw of change.value.messages ?? []) {
        const message = textMessageSchema.safeParse(raw);
        if (!message.success) {
          continue;
        }
        return {
          from: message.data.from,
          messageId: message.data.id,
          text: message.data.text.body,
        };
      }
    }
  }

  return null;
}

export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const env = getEnv();
  if (!hasWhatsAppSendConfig()) {
    logger.info("WhatsApp send skipped (no credentials)", { to });
    return;
  }

  const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      logger.error("WhatsApp send failed", {
        status: response.status,
        detail: detail.slice(0, 300),
      });
      throw new Error(`WhatsApp send failed: ${response.status}`);
    }

    logger.info("WhatsApp message sent", { to });
  } catch (error) {
    logger.error("WhatsApp send error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
