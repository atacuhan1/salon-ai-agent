import { hasOpenAIConfig } from "@/lib/env";
import { runFallbackAgent } from "@/lib/fallback-agent";
import { logger } from "@/lib/logger";
import { runOpenAIAgent } from "@/lib/openai";
import { addMessage, getConversationHistory } from "@/lib/supabase";
import type { AgentResult } from "@/lib/types";

export async function handleUserMessage(
  sessionId: string,
  userMessage: string,
): Promise<AgentResult> {
  const history = await getConversationHistory(sessionId);
  await addMessage(sessionId, "user", userMessage);

  let result: AgentResult;
  if (hasOpenAIConfig()) {
    try {
      result = await runOpenAIAgent(history, userMessage);
    } catch (error) {
      logger.warn("OpenAI failed, using fallback agent", {
        error: error instanceof Error ? error.message : "unknown",
      });
      result = await runFallbackAgent(history, userMessage, sessionId);
    }
  } else {
    result = await runFallbackAgent(history, userMessage, sessionId);
  }

  await addMessage(sessionId, "assistant", result.reply);
  return result;
}
