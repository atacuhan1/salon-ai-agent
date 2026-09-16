import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { checkAvailability, createAppointment } from "@/lib/calendar";
import { getEnv, hasOpenAIConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import { inferDate } from "@/lib/fallback-agent";
import { defaultCatalog, type SalonCatalog } from "@/lib/salon-catalog";
import { formatHumanSalonDate, isPastSalonDate, todayInSalon } from "@/lib/timezone";
import { buildSystemPrompt, findService } from "@/prompts/salon-rules";
import type { AgentResult, ChatMessage } from "@/lib/types";

const TOOL_ROUND_MAX_TOKENS = 500;

export function needsAvailabilityCheck(
  userMessage: string,
  history: ChatMessage[],
  catalog: SalonCatalog = defaultCatalog,
): boolean {
  const today = todayInSalon();
  const date = inferDate(userMessage, today);
  if (date && isPastSalonDate(date, today)) {
    return false;
  }
  const context = `${history.map((message) => message.content).join("\n")}\n${userMessage}`;
  const service =
    findService(userMessage, catalog.services) ?? findService(context, catalog.services);
  const asks =
    /müsait|musait|saat|randevu|uygun|boş|bos|var mı|var mi/.test(
      userMessage.toLocaleLowerCase("tr-TR"),
    ) || Boolean(inferDate(userMessage, today));
  return Boolean(service && asks);
}

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
  catalog: SalonCatalog = defaultCatalog,
): Promise<unknown> {
  const args = rawArgs ? JSON.parse(rawArgs) : {};
  const calendar = { salonKey: catalog.id, hours: catalog.workingHours };

  if (name === "checkAvailability") {
    const slots = await checkAvailability(
      args.date,
      Number(args.durationMinutes),
      calendar,
    );
    return { date: args.date, slots: slots.slice(0, 12) };
  }

  if (name === "createAppointment") {
    return createAppointment(
      args.customerName,
      args.customerPhone,
      args.serviceName,
      args.startDateTime,
      Number(args.durationMinutes),
      calendar,
    );
  }

  throw new Error(`Unknown tool: ${name}`);
}

const MAX_TOOL_ROUNDS = 3;

export async function runOpenAIAgent(
  history: ChatMessage[],
  userMessage: string,
  catalog: SalonCatalog = defaultCatalog,
): Promise<AgentResult> {
  if (!hasOpenAIConfig()) {
    throw new Error("OpenAI is not configured");
  }

  const env = getEnv();
  const client = getOpenAI();
  const today = todayInSalon();
  const resolvedDate = inferDate(userMessage, today);
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(today, catalog) },
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: userMessage },
  ];
  if (resolvedDate && !isPastSalonDate(resolvedDate, today)) {
    messages.push({
      role: "system",
      content: `Tarih: ${resolvedDate} (${formatHumanSalonDate(resolvedDate)}). checkAvailability date bunu kullan.`,
    });
  }

  const toolCalls: string[] = [];
  let forcedAvailability = false;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const forceAvailability =
        !forcedAvailability &&
        toolCalls.length === 0 &&
        needsAvailabilityCheck(userMessage, history, catalog);

      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages,
        tools,
        tool_choice: forceAvailability
          ? { type: "function", function: { name: "checkAvailability" } }
          : "auto",
        temperature: 0.2,
        max_tokens: forceAvailability || toolCalls.length === 0
          ? TOOL_ROUND_MAX_TOKENS
          : env.OPENAI_MAX_TOKENS,
      });

      if (forceAvailability) {
        forcedAvailability = true;
      }

      const choice = completion.choices[0]?.message;
      if (!choice) {
        throw new Error("OpenAI returned an empty message");
      }

      const calls = choice.tool_calls ?? [];
      if (calls.length === 0) {
        if (
          !forcedAvailability &&
          needsAvailabilityCheck(userMessage, history, catalog)
        ) {
          forcedAvailability = true;
          continue;
        }
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
            catalog,
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
