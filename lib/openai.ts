import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { checkAvailability, createAppointment } from "@/lib/calendar";
import { getEnv, hasOpenAIConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import { SYSTEM_PROMPT } from "@/prompts/salon-rules";
import type { AgentResult, ChatMessage } from "@/lib/types";

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "checkAvailability",
      description:
        "Belirtilen tarihte (YYYY-MM-DD, Europe/Istanbul) salonun boş randevu saatlerini döner.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Randevu tarihi, YYYY-MM-DD, Europe/Istanbul",
          },
          durationMinutes: {
            type: "number",
            description: "Hizmet süresi dakika cinsinden",
          },
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
      description:
        "Müşteri adı, telefon, hizmet ve başlangıç saatiyle Google Takvim'e randevu yazar.",
      parameters: {
        type: "object",
        properties: {
          customerName: { type: "string", description: "Müşteri adı soyadı" },
          customerPhone: { type: "string", description: "WhatsApp / telefon" },
          serviceName: { type: "string", description: "Hizmet adı" },
          startDateTime: {
            type: "string",
            description: "Başlangıç, Europe/Istanbul, YYYY-MM-DDTHH:mm",
          },
          durationMinutes: { type: "number", description: "Süre (dakika)" },
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
    return { date: args.date, slots };
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

const MAX_TOOL_ROUNDS = 5;

export async function runOpenAIAgent(
  history: ChatMessage[],
  userMessage: string,
): Promise<AgentResult> {
  if (!hasOpenAIConfig()) {
    throw new Error("OpenAI is not configured");
  }

  const client = getOpenAI();
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
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
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.3,
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
