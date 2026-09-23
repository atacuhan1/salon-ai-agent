import { google } from "googleapis";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DEMO_SALON_KEY } from "@/lib/salon-catalog";
import { getEnv, hasGoogleServiceAccount } from "@/lib/env";
import { logger } from "@/lib/logger";
import { generateAvailableSlots, overlaps, type BusyInterval } from "@/lib/slots";
import {
  formatSalonDate,
  formatSalonDateTime,
  parseStartDateTime,
  salonDateTime,
  toIsoInSalon,
} from "@/lib/timezone";
import type { CreateAppointmentResult, WorkingHours } from "@/lib/types";

const checkAvailabilityInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().positive(),
});

const createAppointmentInput = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(3),
  serviceName: z.string().min(1),
  startDateTime: z.string().min(1),
  durationMinutes: z.number().int().positive(),
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilityInput>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentInput>;

export type CalendarOptions = {
  salonKey?: string;
  hours?: WorkingHours;
  /** Per-salon Google Calendar ID. Required to write/read Google for that salon. */
  googleCalendarId?: string;
};

const memoryBusyBySalon = new Map<string, BusyInterval[]>();

function salonBusy(salonKey: string): BusyInterval[] {
  const existing = memoryBusyBySalon.get(salonKey);
  if (existing) {
    return existing;
  }
  const created: BusyInterval[] = [];
  memoryBusyBySalon.set(salonKey, created);
  return created;
}

function isPersistedSalon(salonKey: string): boolean {
  return salonKey !== DEMO_SALON_KEY && salonKey.length > 0;
}

function resolveGoogleCalendarId(options: CalendarOptions): string | undefined {
  const fromSalon = options.googleCalendarId?.trim();
  if (fromSalon) {
    return fromSalon;
  }
  // Demo / single-tenant fallback only when no salon-scoped ID is set.
  if (!isPersistedSalon(options.salonKey ?? DEMO_SALON_KEY)) {
    return getEnv().GOOGLE_CALENDAR_ID;
  }
  return undefined;
}

function canUseGoogle(options: CalendarOptions): boolean {
  return hasGoogleServiceAccount() && Boolean(resolveGoogleCalendarId(options));
}

function getJwtClient() {
  const env = getEnv();
  if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Google Calendar credentials are missing");
  }

  return new google.auth.JWT({
    email: env.GOOGLE_CLIENT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function calendarClient() {
  return google.calendar({ version: "v3", auth: getJwtClient() });
}

async function listBusyGoogle(
  date: string,
  calendarId: string,
): Promise<BusyInterval[]> {
  const env = getEnv();
  const calendar = calendarClient();
  const timeMin = salonDateTime(date, "00:00").toISOString();
  const timeMax = salonDateTime(date, "23:59").toISOString();

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      timeZone: env.SALON_TIMEZONE,
    });

    return (response.data.items ?? [])
      .map((event) => {
        const startRaw = event.start?.dateTime ?? event.start?.date;
        const endRaw = event.end?.dateTime ?? event.end?.date;
        if (!startRaw || !endRaw) {
          return null;
        }
        return { start: new Date(startRaw), end: new Date(endRaw) };
      })
      .filter((interval): interval is BusyInterval => interval !== null);
  } catch (error) {
    logger.error("Google Calendar list failed", {
      calendarId,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

function listBusyMemory(date: string, salonKey: string): BusyInterval[] {
  const dayStart = salonDateTime(date, "00:00");
  const dayEnd = salonDateTime(date, "23:59");
  return salonBusy(salonKey).filter(
    (interval) => interval.start < dayEnd && interval.end > dayStart,
  );
}

async function listBusyDb(date: string, salonId: string): Promise<BusyInterval[]> {
  const dayStart = salonDateTime(date, "00:00");
  const dayEnd = salonDateTime(date, "23:59");
  const rows = await prisma.appointment.findMany({
    where: {
      salonId,
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    select: { startAt: true, endAt: true },
  });
  return rows.map((row) => ({ start: row.startAt, end: row.endAt }));
}

function mergeBusy(intervals: BusyInterval[][]): BusyInterval[] {
  return intervals.flat();
}

async function listBusyForSalon(
  date: string,
  salonKey: string,
  options: CalendarOptions,
): Promise<{ busy: BusyInterval[]; provider: string }> {
  const googleId = resolveGoogleCalendarId(options);
  const useGoogle = canUseGoogle(options) && googleId;

  if (isPersistedSalon(salonKey)) {
    const dbBusy = await listBusyDb(date, salonKey);
    if (useGoogle && googleId) {
      const googleBusy = await listBusyGoogle(date, googleId);
      return {
        busy: mergeBusy([dbBusy, googleBusy]),
        provider: "db+google",
      };
    }
    return { busy: dbBusy, provider: "db" };
  }

  if (useGoogle && googleId) {
    return {
      busy: await listBusyGoogle(date, googleId),
      provider: "google",
    };
  }

  return { busy: listBusyMemory(date, salonKey), provider: "memory" };
}

export async function checkAvailability(
  date: string,
  durationMinutes: number,
  options: CalendarOptions = {},
): Promise<string[]> {
  const input = checkAvailabilityInput.parse({ date, durationMinutes });
  const salonKey = options.salonKey ?? DEMO_SALON_KEY;

  try {
    const { busy, provider } = await listBusyForSalon(input.date, salonKey, options);
    const slots = generateAvailableSlots(
      input.date,
      input.durationMinutes,
      busy,
      options.hours,
    );
    logger.info("Checked availability", {
      date: input.date,
      durationMinutes: input.durationMinutes,
      slotCount: slots.length,
      provider,
      salonKey,
    });
    return slots;
  } catch (error) {
    logger.error("checkAvailability failed", {
      date: input.date,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

export async function createAppointment(
  customerName: string,
  customerPhone: string,
  serviceName: string,
  startDateTime: string,
  durationMinutes: number,
  options: CalendarOptions = {},
): Promise<CreateAppointmentResult> {
  const input = createAppointmentInput.parse({
    customerName,
    customerPhone,
    serviceName,
    startDateTime,
    durationMinutes,
  });
  const salonKey = options.salonKey ?? DEMO_SALON_KEY;

  const start = parseStartDateTime(input.startDateTime);
  const end = new Date(start.getTime() + input.durationMinutes * 60 * 1000);
  const date = formatSalonDate(start);

  try {
    const { busy } = await listBusyForSalon(date, salonKey, options);
    const conflict = busy.some((interval) => overlaps({ start, end }, interval));
    if (conflict) {
      logger.warn("Appointment rejected because the slot is taken", {
        start: formatSalonDateTime(start),
        salonKey,
      });
      return {
        success: false,
        startDateTime: formatSalonDateTime(start),
        endDateTime: formatSalonDateTime(end),
        message: "Bu saat dolu. Lütfen checkAvailability ile başka bir saat seçin.",
      };
    }

    const googleId = resolveGoogleCalendarId(options);
    const useGoogle = canUseGoogle(options) && googleId;
    let googleEventId: string | undefined;

    if (useGoogle && googleId) {
      const env = getEnv();
      const calendar = calendarClient();
      const response = await calendar.events.insert({
        calendarId: googleId,
        requestBody: {
          summary: `${input.serviceName} — ${input.customerName}`,
          description: `Telefon: ${input.customerPhone}\nHizmet: ${input.serviceName}\nSalon: ${salonKey}`,
          start: {
            dateTime: toIsoInSalon(start),
            timeZone: env.SALON_TIMEZONE,
          },
          end: {
            dateTime: toIsoInSalon(end),
            timeZone: env.SALON_TIMEZONE,
          },
        },
      });
      googleEventId = response.data.id ?? undefined;
      logger.info("Created Google Calendar event", {
        eventId: googleEventId,
        calendarId: googleId,
        salonKey,
      });
    }

    if (isPersistedSalon(salonKey)) {
      const row = await prisma.appointment.create({
        data: {
          salonId: salonKey,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          serviceName: input.serviceName,
          startAt: start,
          endAt: end,
          googleEventId,
        },
      });
      logger.info("Created persisted appointment", {
        appointmentId: row.id,
        salonKey,
        googleEventId,
      });
      return {
        success: true,
        eventId: row.id,
        startDateTime: formatSalonDateTime(start),
        endDateTime: formatSalonDateTime(end),
        message: useGoogle
          ? "Randevu kaydedildi ve Google Takvim'e yazıldı."
          : "Randevu kaydedildi.",
      };
    }

    salonBusy(salonKey).push({ start, end });
    const eventId = googleEventId ?? `mem_${start.getTime()}`;
    logger.info("Created in-memory appointment", { eventId, salonKey });
    return {
      success: true,
      eventId,
      startDateTime: formatSalonDateTime(start),
      endDateTime: formatSalonDateTime(end),
      message: useGoogle
        ? "Randevu Google Takvim'e yazıldı."
        : "Randevu yerel takvime yazıldı (kalıcı salon kaydı yok).",
    };
  } catch (error) {
    logger.error("createAppointment failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

export async function listAppointmentsForDay(
  salonId: string,
  date: string,
): Promise<
  Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    startAt: Date;
    endAt: Date;
  }>
> {
  const dayStart = salonDateTime(date, "00:00");
  const dayEnd = salonDateTime(date, "23:59");
  return prisma.appointment.findMany({
    where: {
      salonId,
      startAt: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      serviceName: true,
      startAt: true,
      endAt: true,
    },
  });
}

export const calendarToolSchemas = {
  checkAvailability: checkAvailabilityInput,
  createAppointment: createAppointmentInput,
};
