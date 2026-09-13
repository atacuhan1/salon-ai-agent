import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { checkAvailability, createAppointment } from "@/lib/calendar";
import { getEnv, hasOpenAIConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import { buildSystemPrompt } from "@/prompts/salon-rules";
import { todayInSalon } from "@/lib/timezone";
import type { AgentResult, ChatMessage } from "@/lib/types";

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "checkAvailability",
        description: "Boş saatleri döner. date=YYYY-MM-DD.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string" },
          durationMinutes: { type: "number" },
        },
        required: ["date", "durationMinutes"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createAppointment",
        description: "Randevu yazar. startDateTime=YYYY-MM-DDTHH:mm (Istanbul).",
      parameters: {
        type: "object",
        properties: {
          customerName: { type: "string" },
          customerPhone: { type: "string" },
          serviceName: { type: "string" },
          startDateTime: { type: "string" },
          durationMinutes: { type: "number" },
        },
        required: [
          "customerName",
          "customerPhone",
          "serviceName",
          "startDateTime",
          "durationMinutes",
        ],
        additionalProperties: false,
      },
    },
  },
];

export const OPENAI_TOOLS = tools;

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }
  openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openaiClient;
}

export async function executeTool(
  name: string,
  rawArgs: string,
): Promise<unknown> {
  const args = rawArgs ? JSON.parse(rawArgs) : {};

  if (name === "checkAvailability") {
    const slots = await checkAvailability(args.date, Number(args.durationMinutes));
    return { date: args.date, slots: slots.slice(0, 12) };
  }

  if (name === "createAppointment") {
    return createAppointment(
      args.customerName,
      args.customerPhone,
      args.serviceName,
      args.startDateTime,
      Number(args.durationMinutes),
    );
  }

  throw new Error(`Unknown tool: ${name}`);
}

const MAX_TOOL_ROUNDS = 3;

export async function runOpenAIAgent(
  history: ChatMessage[],
  userMessage: string,
): Promise<AgentResult> {
  if (!hasOpenAIConfig()) {
    throw new Error("OpenAI is not configured");
  }

  const env = getEnv();
  const client = getOpenAI();
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(todayInSalon()) },
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: userMessage },
  ];

  const toolCalls: string[] = [];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: env.OPENAI_MAX_TOKENS,
      });

      const choice = completion.choices[0]?.message;
      if (!choice) {
        throw new Error("OpenAI returned an empty message");
      }

      const calls = choice.tool_calls ?? [];
      if (calls.length === 0) {
        return {
          reply: choice.content?.trim() || "Şu an yanıt üretemedim. Tekrar dener misiniz?",
          toolCalls,
          usedFallback: false,
        };
      }

      messages.push(choice);
      for (const call of calls) {
        if (call.type !== "function") {
          continue;
        }
        toolCalls.push(call.function.name);
        logger.info("OpenAI requested tool", { tool: call.function.name });
        try {
          const result = await executeTool(
            call.function.name,
            call.function.arguments,
          );
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          logger.error("Tool execution failed", {
            tool: call.function.name,
            error: error instanceof Error ? error.message : "unknown",
          });
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              error: error instanceof Error ? error.message : "unknown",
            }),
          });
        }
      }
    }

    return {
      reply: "Randevu sisteminde bir gecikme oldu. Lütfen tekrar yazar mısınız?",
      toolCalls,
      usedFallback: false,
    };
  } catch (error) {
    logger.error("OpenAI agent failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
