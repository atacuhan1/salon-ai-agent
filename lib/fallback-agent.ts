import { checkAvailability, createAppointment } from "@/lib/calendar";
import { logger } from "@/lib/logger";
import { addDaysToSalonDate, todayInSalon, weekdayInSalon } from "@/lib/timezone";
import type { AgentResult, ChatMessage } from "@/lib/types";
import { SALON_NAME, findService, services } from "@/prompts/salon-rules";

const weekdayMap: Record<string, number> = {
  pazar: 0,
  pazartesi: 1,
  salı: 2,
  sali: 2,
  çarşamba: 3,
  carsamba: 3,
  perşembe: 4,
  persembe: 4,
  cuma: 5,
  cumartesi: 6,
};

function nextWeekdayDate(targetWeekday: number): string {
  const today = todayInSalon();
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = addDaysToSalonDate(today, offset);
    if (weekdayInSalon(candidate) === targetWeekday) {
      return candidate;
    }
  }
  return addDaysToSalonDate(today, 1);
}

export function inferDate(text: string): string | null {
  const lower = text.toLocaleLowerCase("tr-TR");
  const iso = lower.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) {
    return iso[0];
  }

  const dotted = lower.match(/\b(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b/);
  if (dotted) {
    const day = dotted[1].padStart(2, "0");
    const month = dotted[2].padStart(2, "0");
    const year = dotted[3]
      ? dotted[3].length === 2
        ? `20${dotted[3]}`
        : dotted[3]
      : todayInSalon().slice(0, 4);
    return `${year}-${month}-${day}`;
  }

  const months: Record<string, string> = {
    ocak: "01",
    şubat: "02",
    subat: "02",
    mart: "03",
    nisan: "04",
    mayıs: "05",
    mayis: "05",
    haziran: "06",
    temmuz: "07",
    ağustos: "08",
    agustos: "08",
    eylül: "09",
    eylul: "09",
    ekim: "10",
    kasım: "11",
    kasim: "11",
    aralık: "12",
    aralik: "12",
  };
  const named = lower.match(
    /\b(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?/,
  );
  if (named) {
    const day = named[1].padStart(2, "0");
    const month = months[named[2]];
    const year = named[3] ?? todayInSalon().slice(0, 4);
    return `${year}-${month}-${day}`;
  }

  if (lower.includes("bugün") || lower.includes("bugun")) {
    return todayInSalon();
  }
  if (lower.includes("yarın") || lower.includes("yarin")) {
    return addDaysToSalonDate(todayInSalon(), 1);
  }
  if (lower.includes("öbür gün") || lower.includes("obur gun") || lower.includes("ertesi")) {
    return addDaysToSalonDate(todayInSalon(), 2);
  }

  for (const [name, weekday] of Object.entries(weekdayMap)) {
    if (lower.includes(name)) {
      return nextWeekdayDate(weekday);
    }
  }

  return null;
}

function inferTime(text: string): string | null {
  const match = text.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  const hourOnly = text.match(/\b(\d{1,2})\s*(?:'?(?:de|da|te|ta))?\b/);
  if (hourOnly && /saat|randevu|olsun|ayır|ayir/.test(text.toLocaleLowerCase("tr-TR"))) {
    const hour = Number(hourOnly[1]);
    if (hour >= 8 && hour <= 20) {
      return `${String(hour).padStart(2, "0")}:00`;
    }
  }
  return null;
}

function inferName(text: string): string | null {
  const match = text.match(
    /(?:adım|adim|ismim|ben)\s+([A-ZÇĞİÖŞÜÂÊÎÔÛa-zçğıöşüâêîôû]+(?:\s+[A-ZÇĞİÖŞÜÂÊÎÔÛa-zçğıöşüâêîôû]+)?)/,
  );
  return match?.[1]?.trim() ?? null;
}

function inferPhone(text: string): string | null {
  const digits = text.replace(/[^\d+]/g, " ");
  const match = digits.match(/(\+?90)?\s*(5\d{2})\s*(\d{3})\s*(\d{2})\s*(\d{2})/);
  if (!match) {
    return null;
  }
  return `+90${match[2]}${match[3]}${match[4]}${match[5]}`;
}

function lastAssistantHints(history: ChatMessage[]): string {
  return history
    .slice(-6)
    .map((message) => message.content)
    .join("\n");
}

function looksLikeAvailability(text: string): boolean {
  const lower = text.toLocaleLowerCase("tr-TR");
  return /müsait|musait|boş|bos|saat|randevu|uygun|var mı|var mi/.test(lower);
}

function looksLikeBooking(text: string): boolean {
  const lower = text.toLocaleLowerCase("tr-TR");
  return /olsun|ayır|ayir|alayım|alayim|onayla|rezerve|book|randevu ver|yaz/.test(lower);
}

function looksLikeMedical(text: string): boolean {
  const lower = text.toLocaleLowerCase("tr-TR");
  return /alerji|hastalık|hastalik|hamile|tıp|tip|tedavi|mantar|sedef|egzama|doktor/.test(
    lower,
  );
}

function serviceList(): string {
  return services
    .map((service) => `• ${service.name} — ${service.durationMinutes} dk / ${service.priceTry} TL`)
    .join("\n");
}

export async function runFallbackAgent(
  history: ChatMessage[],
  userMessage: string,
  sessionId: string,
): Promise<AgentResult> {
  const toolCalls: string[] = [];
  const context = `${lastAssistantHints(history)}\n${userMessage}`;
  const service = findService(context);

  if (looksLikeMedical(userMessage)) {
    return {
      reply:
        "Tıbbi veya işlem tavsiyesi veremiyorum. İsterseniz hizmetlerimizin fiyatını, süresini veya müsait saatleri söyleyebilirim.",
      toolCalls,
      usedFallback: true,
    };
  }

  if (/hizmet|fiyat|liste|neler var|menü|menu/.test(userMessage.toLocaleLowerCase("tr-TR"))) {
    return {
      reply: `${SALON_NAME} hizmetleri:\n${serviceList()}\n\nHangi gün için bakmamı istersiniz?`,
      toolCalls,
      usedFallback: true,
    };
  }

  const date = inferDate(context);
  const time = inferTime(userMessage);
  const name = inferName(userMessage);
  const phone = inferPhone(userMessage) ?? (/^\d{10,15}$/.test(sessionId) ? sessionId : null);

  if (looksLikeBooking(userMessage) && service && date && time && name && phone) {
    toolCalls.push("createAppointment");
    logger.info("Fallback calling createAppointment", { date, time });
    const result = await createAppointment(
      name,
      phone,
      service.name,
      `${date}T${time}`,
      service.durationMinutes,
    );
    if (!result.success) {
      return {
        reply: `${result.startDateTime} saati dolu. Başka bir saat ister misiniz? Müsaitlik için tekrar sorabilirsiniz.`,
        toolCalls,
        usedFallback: true,
      };
    }
    return {
      reply: `Randevunuz alındı. ${service.name}, ${result.startDateTime} – ${result.endDateTime}. ${SALON_NAME}'nde sizi bekliyoruz.`,
      toolCalls,
      usedFallback: true,
    };
  }

  if ((looksLikeAvailability(userMessage) || date) && service && date) {
    toolCalls.push("checkAvailability");
    logger.info("Fallback calling checkAvailability", {
      date,
      durationMinutes: service.durationMinutes,
    });
    const slots = await checkAvailability(date, service.durationMinutes);
    if (slots.length === 0) {
      return {
        reply: `${date} tarihinde ${service.name} için uygun saat kalmadı. Başka bir gün dener misiniz?`,
        toolCalls,
        usedFallback: true,
      };
    }
    return {
      reply: `${date} için ${service.name} (${service.durationMinutes} dk, ${service.priceTry} TL) müsait saatler: ${slots.join(", ")}.\nİstediğiniz saati, adınızı ve telefonunuzu yazmanız yeterli.`,
      toolCalls,
      usedFallback: true,
    };
  }

  if (looksLikeBooking(userMessage) && (!name || !phone || !time || !service || !date)) {
    return {
      reply:
        "Randevuyu yazmam için hizmet, tarih, saat, adınız ve telefonunuz lazım. Eksik olanı tamamlar mısınız?",
      toolCalls,
      usedFallback: true,
    };
  }

  return {
    reply: `Merhaba, ${SALON_NAME} randevu asistanıyım. Protez tırnak, kalıcı oje, manikür ve pedikür için fiyat, süre veya müsait saat söyleyebilirim. Örnek: "Yarın protez tırnak için müsait misiniz?"`,
    toolCalls,
    usedFallback: true,
  };
}
