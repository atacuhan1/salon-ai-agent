import { getEnv } from "@/lib/env";

export const ISTANBUL_OFFSET = "+03:00";

export function salonTimeZone(): string {
  return getEnv().SALON_TIMEZONE || "Europe/Istanbul";
}

/** Parse YYYY-MM-DD as a calendar date in Europe/Istanbul. */
export function parseSalonDate(date: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) {
    throw new Error(`Invalid date. Use YYYY-MM-DD (Europe/Istanbul): ${date}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/** Build a Date for HH:mm on YYYY-MM-DD in Europe/Istanbul (UTC+3, no DST). */
export function salonDateTime(date: string, time: string): Date {
  const { year, month, day } = parseSalonDate(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!timeMatch) {
    throw new Error(`Invalid time. Use HH:mm: ${time}`);
  }
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  return new Date(
    Date.UTC(year, month - 1, day, hours - 3, minutes, 0, 0),
  );
}

export function weekdayInSalon(date: string): number {
  return salonDateTime(date, "12:00").getUTCDay();
}

export function formatSalonTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: salonTimeZone(),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatSalonDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: salonTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatSalonDateTime(date: Date): string {
  return `${formatSalonDate(date)} ${formatSalonTime(date)}`;
}

export function nowInSalon(): Date {
  return new Date();
}

export function todayInSalon(): string {
  return formatSalonDate(nowInSalon());
}

export function addDaysToSalonDate(date: string, days: number): string {
  const start = salonDateTime(date, "12:00");
  const shifted = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return formatSalonDate(shifted);
}

export function toIsoInSalon(date: Date): string {
  const day = formatSalonDate(date);
  const time = formatSalonTime(date);
  return `${day}T${time}:00${ISTANBUL_OFFSET}`;
}

export function parseStartDateTime(value: string): Date {
  const trimmed = value.trim();
  const isoMatch = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(trimmed);
  if (isoMatch) {
    return salonDateTime(isoMatch[1], isoMatch[2]);
  }
  const asDate = new Date(trimmed);
  if (Number.isNaN(asDate.getTime())) {
    throw new Error(`Invalid startDateTime: ${value}`);
  }
  return asDate;
}
