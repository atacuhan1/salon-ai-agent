import type { Service, StaffMember, WorkingHours } from "@/lib/types";
import {
  SALON_ADDRESS,
  SALON_NAME,
  SALON_PHONE,
  services as defaultServices,
  weekdayLabels,
  workingHours as defaultHours,
} from "@/prompts/salon-rules";

export interface SalonCatalog {
  id: string;
  slug: string;
  name: string;
  phone: string;
  address: string;
  services: Service[];
  workingHours: WorkingHours;
  staff: StaffMember[];
}

export const DEMO_SALON_KEY = "demo";

export const defaultCatalog: SalonCatalog = {
  id: DEMO_SALON_KEY,
  slug: "demo",
  name: SALON_NAME,
  phone: SALON_PHONE,
  address: SALON_ADDRESS,
  services: defaultServices,
  workingHours: defaultHours,
  staff: [],
};

export function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function parseWeekdays(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is number => Number.isInteger(item) && item >= 0 && item <= 6);
  } catch {
    return [];
  }
}

export function keywordsFromName(name: string, extra: string[] = []): string[] {
  const fromName = name
    .toLocaleLowerCase("tr-TR")
    .split(/[^a-zçğıöşü0-9+]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
  return [...new Set([...fromName, ...extra.map((item) => item.toLocaleLowerCase("tr-TR"))])];
}

export function hoursFromRecords(
  records: Array<{ weekday: number; openTime: string | null; closeTime: string | null }>,
): WorkingHours {
  const hours: WorkingHours = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
  for (const record of records) {
    if (record.openTime && record.closeTime) {
      hours[record.weekday] = { open: record.openTime, close: record.closeTime };
    } else {
      hours[record.weekday] = null;
    }
  }
  return hours;
}

export function effectiveWorkingHours(catalog: SalonCatalog): WorkingHours {
  const hours: WorkingHours = { ...catalog.workingHours };
  const activeStaff = catalog.staff.filter((member) => member.active);
  if (activeStaff.length === 0) {
    return hours;
  }

  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const salonHours = hours[weekday];
    if (!salonHours) {
      continue;
    }
    const working = activeStaff.filter((member) => member.weekdays.includes(weekday));
    if (working.length === 0) {
      hours[weekday] = null;
    }
  }

  return hours;
}

export function hoursBlurb(hours: WorkingHours): string {
  const openDays = [1, 2, 3, 4, 5, 6, 0]
    .map((weekday) => {
      const slot = hours[weekday];
      if (!slot) {
        return `${weekdayLabels[weekday]} kapalı`;
      }
      return `${weekdayLabels[weekday]} ${slot.open}–${slot.close}`;
    })
    .join(", ");
  return openDays;
}

export function staffBlurb(staff: StaffMember[]): string {
  const active = staff.filter((member) => member.active);
  if (active.length === 0) {
    return "Tek kişi veya belirtilmemiş.";
  }
  return active
    .map((member) => {
      const days = member.weekdays
        .slice()
        .sort((a, b) => a - b)
        .map((day) => weekdayLabels[day])
        .join("/");
      return `${member.name} (${days || "gün yok"} ${member.open}–${member.close})`;
    })
    .join("; ");
}
