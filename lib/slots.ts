import { SLOT_STEP_MINUTES, workingHours } from "@/prompts/salon-rules";
import {
  formatSalonTime,
  salonDateTime,
  weekdayInSalon,
} from "@/lib/timezone";

export interface BusyInterval {
  start: Date;
  end: Date;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function overlaps(a: BusyInterval, b: BusyInterval): boolean {
  return a.start < b.end && a.end > b.start;
}

export function generateAvailableSlots(
  date: string,
  durationMinutes: number,
  busy: BusyInterval[],
): string[] {
  if (durationMinutes <= 0) {
    throw new Error("durationMinutes must be positive");
  }

  const weekday = weekdayInSalon(date);
  const hours = workingHours[weekday];
  if (!hours) {
    return [];
  }

  const dayStart = salonDateTime(date, hours.open);
  const dayEnd = salonDateTime(date, hours.close);
  const slots: string[] = [];

  for (
    let cursor = dayStart;
    addMinutes(cursor, durationMinutes) <= dayEnd;
    cursor = addMinutes(cursor, SLOT_STEP_MINUTES)
  ) {
    const candidate = { start: cursor, end: addMinutes(cursor, durationMinutes) };
    const taken = busy.some((interval) => overlaps(candidate, interval));
    if (!taken) {
      slots.push(formatSalonTime(cursor));
    }
  }

  return slots;
}
