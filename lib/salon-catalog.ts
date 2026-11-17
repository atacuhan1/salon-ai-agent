import type { Service, StaffMember, WorkingHours } from "@/lib/types";
import {
  SALON_ADDRESS,
  SALON_NAME,
  SALON_PHONE,
  services as defaultServices,
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
  /** Meta Cloud API phone_number_id bound to this salon (optional). */
  whatsappPhoneNumberId?: string;
  /** Google Calendar ID for this salon (optional). */
  googleCalendarId?: string;
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

const STAFF_NAME_SUFFIX =
  "(?:['’]?(?:dan|den|tan|ten|ya|ye|yla|yle|nın|nin|nun|nün|ın|in|un|ün|a|e|la|le))?";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds an active staff member mentioned in free text (e.g. "Ayşe'den randevu",
 * "ayseden"). Only names from this salon's catalog are matched.
 */
export function findStaffInText(text: string, staff: StaffMember[]): StaffMember | null {
  const lower = text.toLocaleLowerCase("tr-TR");
  const ranked = staff
    .filter((member) => member.active && member.name.trim().length >= 2)
    .map((member) => {
      const name = member.name.trim().toLocaleLowerCase("tr-TR");
      const pattern = new RegExp(
        `(?:^|[^a-zçğıöşüâêîôû0-9])${escapeRegExp(name)}${STAFF_NAME_SUFFIX}(?=$|[^a-zçğıöşüâêîôû0-9])`,
        "u",
      );
      return { member, hit: pattern.test(lower), length: name.length };
    })
    .filter((entry) => entry.hit)
    .sort((a, b) => b.length - a.length);
  return ranked[0]?.member ?? null;
}

/** Exact (case-insensitive) lookup used for LLM tool arguments. Inactive staff never match. */
export function findStaffByName(name: string, staff: StaffMember[]): StaffMember | null {
  const wanted = name.trim().toLocaleLowerCase("tr-TR");
  if (!wanted) {
    return null;
  }
  return (
    staff.find(
      (member) => member.active && member.name.trim().toLocaleLowerCase("tr-TR") === wanted,
    ) ?? null
  );
}

/**
 * Hours in which a specific staff member can take bookings: the salon's hours
 * intersected with the staff member's weekdays and personal open/close times.
 * A day the staff member does not work (or an empty intersection) is closed.
 */
export function staffWorkingHours(salonHours: WorkingHours, member: StaffMember): WorkingHours {
  const hours: WorkingHours = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
  if (!member.active) {
    return hours;
  }
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const salon = salonHours[weekday];
    if (!salon || !member.weekdays.includes(weekday)) {
      continue;
    }
    const open = member.open > salon.open ? member.open : salon.open;
    const close = member.close < salon.close ? member.close : salon.close;
    hours[weekday] = open < close ? { open, close } : null;
  }
  return hours;
}
