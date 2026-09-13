import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getEnv, hasSupabaseConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { ChatMessage, ChatRole } from "@/lib/types";

const addMessageInput = z.object({
  sessionId: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

interface StoredRow {
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

const memoryStore = new Map<string, StoredRow[]>();

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }
  const env = getEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured");
  }
  client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export async function addMessage(
  sessionId: string,
  role: ChatRole,
  content: string,
): Promise<void> {
  const input = addMessageInput.parse({ sessionId, role, content });
  const row: StoredRow = {
    session_id: input.sessionId,
    role: input.role,
    content: input.content,
    created_at: new Date().toISOString(),
  };

  if (!hasSupabaseConfig()) {
    const existing = memoryStore.get(input.sessionId) ?? [];
    existing.push(row);
    memoryStore.set(input.sessionId, existing);
    logger.debug("Stored message in memory", { sessionId: input.sessionId, role });
    return;
  }

  try {
    const { error } = await getSupabase().from("conversations").insert({
      session_id: input.sessionId,
      role: input.role,
      content: input.content,
    });
    if (error) {
      throw error;
    }
    logger.debug("Stored message in Supabase", { sessionId: input.sessionId, role });
  } catch (error) {
    logger.error("addMessage failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

export async function getConversationHistory(
  sessionId: string,
): Promise<ChatMessage[]> {
  const id = z.string().min(1).parse(sessionId);

  if (!hasSupabaseConfig()) {
    const rows = memoryStore.get(id) ?? [];
    return rows.slice(-10).map((row) => ({ role: row.role, content: row.content }));
  }

  try {
    const { data, error } = await getSupabase()
      .from("conversations")
      .select("role, content, created_at")
      .eq("session_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return (data ?? [])
      .reverse()
      .map((row) => ({
        role: row.role as ChatRole,
        content: row.content as string,
      }));
  } catch (error) {
    logger.error("getConversationHistory failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
