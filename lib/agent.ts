import { hasOpenAIConfig } from "@/lib/env";
import { runFallbackAgent } from "@/lib/fallback-agent";
import { logger } from "@/lib/logger";
import { runOpenAIAgent } from "@/lib/openai";
import { defaultCatalog, type SalonCatalog } from "@/lib/salon-catalog";
import { loadSalonBySlug } from "@/lib/salon-store";
import { addMessage, getConversationHistory } from "@/lib/supabase";
import type { AgentResult } from "@/lib/types";

export class SalonAccessError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "expired",
  ) {
    super(message);
    this.name = "SalonAccessError";
  }
}

export async function resolveCatalog(salonSlug?: string): Promise<SalonCatalog> {
  if (!salonSlug) {
    return defaultCatalog;
  }
  const loaded = await loadSalonBySlug(salonSlug);
  if (!loaded) {
    throw new SalonAccessError("Salon bulunamadı.", "not_found");
  }
  if (!loaded.accessActive) {
    throw new SalonAccessError(
      "Bu salon şu an randevu asistanını kullanmıyor.",
      "expired",
    );
  }
  return loaded.catalog;
}

export async function handleUserMessage(
  sessionId: string,
  userMessage: string,
  salonSlug?: string,
): Promise<AgentResult> {
  const catalog = await resolveCatalog(salonSlug);
  const scopedSession = salonSlug ? `${salonSlug}:${sessionId}` : sessionId;
  const history = await getConversationHistory(scopedSession);
  await addMessage(scopedSession, "user", userMessage);

  let result: AgentResult;
  if (hasOpenAIConfig()) {
    try {
      result = await runOpenAIAgent(history, userMessage, catalog);
    } catch (error) {
      logger.warn("OpenAI failed, using fallback agent", {
        error: error instanceof Error ? error.message : "unknown",
      });
      result = await runFallbackAgent(history, userMessage, scopedSession, catalog);
    }
  } else {
    result = await runFallbackAgent(history, userMessage, scopedSession, catalog);
  }

  await addMessage(scopedSession, "assistant", result.reply);
  return result;
}
