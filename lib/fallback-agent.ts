import { checkAvailability, createAppointment } from "@/lib/calendar";
import { logger } from "@/lib/logger";
import {
  addDaysToSalonDate,
  formatHumanSalonDate,
  isPastSalonDate,
  todayInSalon,
  weekdayInSalon,
} from "@/lib/timezone";
import type { AgentResult, ChatMessage } from "@/lib/types";
import { SALON_NAME, findService, services, weekdayLabels, workingHours } from "@/prompts/salon-rules";

const weekdayEntries = [
  ["pazartesi", 1],
  ["çarşamba", 3],
  ["carsamba", 3],
  ["perşembe", 4],
  ["persembe", 4],
  ["cumartesi", 6],
  ["pazar", 0],
  ["salı", 2],
  ["sali", 2],
  ["cuma", 5],
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findWeekday(text: string): number | null {
  for (const [name, weekday] of weekdayEntries) {
    const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(name)}(?:\\s|$|[.,!?])`, "i");
    if (pattern.test(text)) {
      return weekday;
    }
  }
  return null;
}

function upcomingWeekday(targetWeekday: number, today: string): string {
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = addDaysToSalonDate(today, offset);
    if (weekdayInSalon(candidate) === targetWeekday) {
      return candidate;
    }
  }
  return addDaysToSalonDate(today, 1);
}

/** Monday of the next calendar week (Europe/Istanbul). */
function nextWeekMonday(today: string): string {
  const weekday = weekdayInSalon(today);
  const daysUntilNextMonday = weekday === 0 ? 1 : 8 - weekday;
  return addDaysToSalonDate(today, daysUntilNextMonday);
}

function dateInNextWeek(targetWeekday: number, today: string): string {
  const monday = nextWeekMonday(today);
  if (targetWeekday === 1) {
    return monday;
  }
  if (targetWeekday === 0) {
    return addDaysToSalonDate(monday, 6);
  }
  return addDaysToSalonDate(monday, targetWeekday - 1);
}

export function inferDate(text: string, today = todayInSalon()): string | null {
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
      : today.slice(0, 4);
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
    const year = named[3] ?? today.slice(0, 4);
    return `${year}-${month}-${day}`;
  }

  if (/(?:^|\s)(evvelsi gün|evvelsi gun|önceki gün|onceki gun)(?:\s|$)/.test(lower)) {
    return addDaysToSalonDate(today, -2);
  }
  if (/(?:^|\s)dün(?:\s|$|[.,!?])/.test(lower)) {
    return addDaysToSalonDate(today, -1);
  }
  if (lower.includes("bugün") || lower.includes("bugun")) {
    return today;
  }
  if (lower.includes("yarın") || lower.includes("yarin")) {
    return addDaysToSalonDate(today, 1);
  }
  if (lower.includes("öbür gün") || lower.includes("obur gun") || lower.includes("ertesi")) {
    return addDaysToSalonDate(today, 2);
  }

  const weekday = findWeekday(lower);

  if (/(?:^|\s)haftaya(?:\s|$|[.,!?])/.test(lower) || /gelecek hafta|önümüzdeki hafta|onumuzdeki hafta/.test(lower)) {
    if (weekday !== null) {
      return dateInNextWeek(weekday, today);
    }
    return addDaysToSalonDate(today, 7);
  }

  if (weekday !== null && /önümüzdeki|onumuzdeki|gelecek/.test(lower)) {
    return dateInNextWeek(weekday, today);
  }

  if (weekday !== null) {
    return upcomingWeekday(weekday, today);
  }

  return null;
}

function lastUserDate(history: ChatMessage[], userMessage: string, today: string): string | null {
  const fromCurrent = inferDate(userMessage, today);
  if (fromCurrent) {
    return fromCurrent;
  }
  for (const message of [...history].reverse()) {
    if (message.role !== "user") {
      continue;
    }
    const found = inferDate(message.content, today);
    if (found) {
      return found;
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

function looksLikeDateFollowup(text: string, date: string | null): boolean {
  if (!date) {
    return false;
  }
  const words = text.trim().split(/\s+/).length;
  return words <= 6 && !looksLikeBooking(text);
}

function serviceList(): string {
  return services
    .map((service) => `• ${service.name} — ${service.durationMinutes} dk / ${service.priceTry} TL`)
    .join("\n");
}

async function availabilityReply(
  date: string,
  serviceName: string,
  durationMinutes: number,
  priceTry: number,
  toolCalls: string[],
): Promise<AgentResult> {
  const human = formatHumanSalonDate(date);
  const weekday = weekdayInSalon(date);
  if (!workingHours[weekday]) {
    return {
      reply: `${human} günü salon kapalı (${weekdayLabels[weekday]}). Başka bir gün söyleyin.`,
      toolCalls,
      usedFallback: true,
    };
  }

  toolCalls.push("checkAvailability");
  logger.info("Fallback calling checkAvailability", { date, durationMinutes });
  const slots = await checkAvailability(date, durationMinutes);
  if (slots.length === 0) {
    return {
      reply: `${human} tarihinde ${serviceName} için uygun saat kalmadı. Başka bir gün dener misiniz?`,
      toolCalls,
      usedFallback: true,
    };
  }
  return {
    reply: `${human} için ${serviceName} (${durationMinutes} dk, ${priceTry} TL) müsait saatler: ${slots.join(", ")}.\nİstediğiniz saati, adınızı ve telefonunuzu yazmanız yeterli.`,
    toolCalls,
    usedFallback: true,
  };
}

export async function runFallbackAgent(
  history: ChatMessage[],
  userMessage: string,
  sessionId: string,
): Promise<AgentResult> {
  const toolCalls: string[] = [];
  const today = todayInSalon();
  const historyText = history
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");
  const service = findService(userMessage) ?? findService(historyText);

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

  const date = lastUserDate(history, userMessage, today);
  const dateFromThisMessage = inferDate(userMessage, today);
  const time = inferTime(userMessage);
  const name = inferName(userMessage);
  const phone = inferPhone(userMessage) ?? (/^\d{10,15}$/.test(sessionId) ? sessionId : null);

  if (dateFromThisMessage && isPastSalonDate(dateFromThisMessage, today)) {
    return {
      reply: `${formatHumanSalonDate(dateFromThisMessage)} geçmişte. Geçmiş güne randevu alamam. Bugün veya sonrası için bir tarih söyleyin.`,
      toolCalls,
      usedFallback: true,
    };
  }

  if (looksLikeBooking(userMessage) && service && date && time && name && phone) {
    if (isPastSalonDate(date, today)) {
      return {
        reply: `${formatHumanSalonDate(date)} geçmişte. Lütfen bugün veya sonrası için bir saat seçin.`,
        toolCalls,
        usedFallback: true,
      };
    }
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
        reply: `${result.startDateTime} saati dolu. Başka bir saat ister misiniz?`,
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

  if (
    service &&
    date &&
    (looksLikeAvailability(userMessage) || looksLikeDateFollowup(userMessage, dateFromThisMessage))
  ) {
    return availabilityReply(
      dateFromThisMessage ?? date,
      service.name,
      service.durationMinutes,
      service.priceTry,
      toolCalls,
    );
  }

  if (dateFromThisMessage && !service) {
    return {
      reply: `${formatHumanSalonDate(dateFromThisMessage)} için hangi hizmete bakayım? Protez tırnak, kalıcı oje, manikür veya pedikür.`,
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
    reply: `Merhaba, ${SALON_NAME} randevu asistanıyım. Hangi gün ve hizmet için bakmamı istersiniz? Örnek: "Yarın protez tırnak" veya "haftaya salı kalıcı oje".`,
    toolCalls,
    usedFallback: true,
  };
}
