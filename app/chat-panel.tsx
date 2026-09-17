"use client";

import { useEffect, useRef, useState } from "react";

interface UiMessage {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Hizmetler ve fiyatlar neler?",
  "Yarın için müsait misiniz?",
  "Bu hafta hangi günler açıksınız?",
];

export function ChatPanel({
  salonName = "Bloom Tırnak Atölyesi",
  salonSlug,
  locked = false,
  lockMessage,
  suggestions = DEFAULT_SUGGESTIONS,
}: {
  salonName?: string;
  salonSlug?: string;
  locked?: boolean;
  lockMessage?: string;
  suggestions?: string[];
}) {
  const [sessionId, setSessionId] = useState("905551234567");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      content: locked
        ? lockMessage || "Bu salonun aboneliği aktif değil."
        : `Merhaba, ${salonName} randevu asistanıyım. Hizmet, fiyat veya müsait saat sorabilirsiniz.`,
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending || locked) {
      return;
    }

    setInput("");
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: trimmed, salonSlug }),
      });
      const data = (await response.json()) as {
        reply?: string;
        toolCalls?: string[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Yanıt alınamadı");
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply ?? "",
          tools: data.toolCalls,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Bir hata oluştu: ${error.message}`
              : "Bir hata oluştu.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex min-h-[640px] flex-1 flex-col overflow-hidden rounded-3xl border border-[#eadfd6] bg-[#fffaf6] shadow-[0_24px_80px_rgba(90,50,40,0.12)]">
      <header className="border-b border-[#eadfd6] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm tracking-[0.2em] uppercase text-[#8e4b56]">
              {salonSlug ? salonName : "Test sohbeti"}
            </p>
            <p className="text-xl font-medium">
              {locked ? "Asistan kapalı" : "WhatsApp olmadan dene"}
            </p>
          </div>
          <label className="text-xs text-[#8e4b56]">
            session_id
            <input
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              className="mt-1 block w-40 rounded-full border border-[#eadfd6] bg-white px-3 py-1 font-mono text-[11px] text-[#3b2a2c]"
            />
          </label>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
              message.role === "user"
                ? "ml-auto bg-[#b76e79] text-white"
                : "bg-[#f6ebe4] text-[#3b2a2c]"
            }`}
          >
            {message.content}
            {message.tools && message.tools.length > 0 ? (
              <p className="mt-2 text-[11px] tracking-wide uppercase opacity-70">
                araç: {message.tools.join(", ")}
              </p>
            ) : null}
          </article>
        ))}
        {pending ? (
          <p className="text-sm text-[#8e4b56]">Asistan bakıyor…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 px-5 pb-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={locked}
            onClick={() => send(suggestion)}
            className="rounded-full border border-[#eadfd6] px-3 py-1 text-sm text-[#5a4144] hover:border-[#b76e79] disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-[#eadfd6] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={locked}
          placeholder="Örn. Yarın için müsait misiniz?"
          className="flex-1 rounded-full border border-[#eadfd6] bg-white px-4 py-3 text-[#3b2a2c] outline-none focus:border-[#b76e79] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending || locked}
          className="rounded-full bg-[#8e4b56] px-5 py-3 text-sm tracking-wide text-white uppercase disabled:opacity-50"
        >
          Gönder
        </button>
      </form>
    </section>
  );
}
