import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  effectiveWorkingHours,
  hoursFromRecords,
  keywordsFromName,
  parseJsonArray,
  parseWeekdays,
  type SalonCatalog,
} from "@/lib/salon-catalog";
import { getAccessState } from "@/lib/subscription";
import type { Service, StaffMember } from "@/lib/types";
import { services as starterServices, workingHours as starterHours } from "@/prompts/salon-rules";

type SalonWithSettings = Prisma.SalonGetPayload<{
  include: { services: true; staff: true; hours: true };
}>;

export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (true) {
    const existing = await prisma.salon.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === exceptId) {
      return candidate;
    }
    candidate = `${base}-${n}`;
    n += 1;
  }
}

export async function seedSalonDefaults(salonId: string): Promise<void> {
  await prisma.service.createMany({
    data: starterServices.map((service, index) => ({
      salonId,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceTry: service.priceTry,
      keywords: JSON.stringify(service.keywords),
      sortOrder: index,
    })),
  });

  await prisma.staffMember.create({
    data: {
      salonId,
      name: "Usta",
      weekdays: JSON.stringify([1, 2, 3, 4, 5, 6]),
      openTime: "10:00",
      closeTime: "19:00",
    },
  });

  await prisma.salonHour.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
      const slot = starterHours[weekday];
      return {
        salonId,
        weekday,
        openTime: slot?.open ?? null,
        closeTime: slot?.close ?? null,
      };
    }),
  });
}

function mapServices(rows: SalonWithSettings["services"]): Service[] {
  return rows
    .filter((row) => row.active)
    .map((row) => {
      const stored = parseJsonArray(row.keywords);
      return {
        id: row.id,
        name: row.name,
        durationMinutes: row.durationMinutes,
        priceTry: row.priceTry,
        keywords: stored.length > 0 ? stored : keywordsFromName(row.name),
      };
    });
}

function mapStaff(rows: SalonWithSettings["staff"]): StaffMember[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    weekdays: parseWeekdays(row.weekdays),
    open: row.openTime,
    close: row.closeTime,
    active: row.active,
  }));
}

export function salonToCatalog(salon: SalonWithSettings): SalonCatalog {
  return {
    id: salon.id,
    slug: salon.slug,
    name: salon.name,
    phone: salon.phone,
    address: salon.address,
    services: mapServices(salon.services),
    workingHours: hoursFromRecords(salon.hours),
    staff: mapStaff(salon.staff),
    whatsappPhoneNumberId: salon.whatsappPhoneNumberId ?? undefined,
    googleCalendarId: salon.googleCalendarId ?? undefined,
  };
}

export async function loadSalonBySlug(slug: string): Promise<{
  catalog: SalonCatalog;
  accessActive: boolean;
} | null> {
  const salon = await prisma.salon.findUnique({
    where: { slug },
    include: {
      services: { orderBy: { sortOrder: "asc" } },
      staff: true,
      hours: true,
    },
  });
  if (!salon) {
    return null;
  }
  const catalog = salonToCatalog(salon);
  catalog.workingHours = effectiveWorkingHours(catalog);
  return {
    catalog,
    accessActive: getAccessState(salon).active,
  };
}

/** Resolve salon from Meta WhatsApp Cloud API metadata.phone_number_id. */
export async function loadSalonByWhatsAppPhoneNumberId(
  phoneNumberId: string,
): Promise<{
  catalog: SalonCatalog;
  accessActive: boolean;
} | null> {
  const trimmed = phoneNumberId.trim();
  if (!trimmed) {
    return null;
  }
  const salon = await prisma.salon.findUnique({
    where: { whatsappPhoneNumberId: trimmed },
    include: {
      services: { orderBy: { sortOrder: "asc" } },
      staff: true,
      hours: true,
    },
  });
  if (!salon) {
    return null;
  }
  const catalog = salonToCatalog(salon);
  catalog.workingHours = effectiveWorkingHours(catalog);
  return {
    catalog,
    accessActive: getAccessState(salon).active,
  };
}
