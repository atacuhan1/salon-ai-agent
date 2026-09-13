import { google } from "googleapis";
import { z } from "zod";
import { getEnv, hasGoogleCalendarConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import { generateAvailableSlots, overlaps, type BusyInterval } from "@/lib/slots";
import {
  formatSalonDate,
  formatSalonDateTime,
  parseStartDateTime,
  salonDateTime,
  toIsoInSalon,
} from "@/lib/timezone";
import type { CreateAppointmentResult } from "@/lib/types";

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

const memoryBusy: BusyInterval[] = [];

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

async function listBusyGoogle(date: string): Promise<BusyInterval[]> {
  const env = getEnv();
  const calendar = calendarClient();
  const timeMin = salonDateTime(date, "00:00").toISOString();
  const timeMax = salonDateTime(date, "23:59").toISOString();

  try {
    const response = await calendar.events.list({
      calendarId: env.GOOGLE_CALENDAR_ID,
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
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

function listBusyMemory(date: string): BusyInterval[] {
  const dayStart = salonDateTime(date, "00:00");
  const dayEnd = salonDateTime(date, "23:59");
  return memoryBusy.filter((interval) =>
    interval.start < dayEnd && interval.end > dayStart,
  );
}

export async function checkAvailability(
  date: string,
  durationMinutes: number,
): Promise<string[]> {
  const input = checkAvailabilityInput.parse({ date, durationMinutes });

  try {
    const busy = hasGoogleCalendarConfig()
      ? await listBusyGoogle(input.date)
      : listBusyMemory(input.date);
    const slots = generateAvailableSlots(input.date, input.durationMinutes, busy);
    logger.info("Checked availability", {
      date: input.date,
      durationMinutes: input.durationMinutes,
      slotCount: slots.length,
      provider: hasGoogleCalendarConfig() ? "google" : "memory",
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
): Promise<CreateAppointmentResult> {
  const input = createAppointmentInput.parse({
    customerName,
    customerPhone,
    serviceName,
    startDateTime,
    durationMinutes,
  });

  const start = parseStartDateTime(input.startDateTime);
  const end = new Date(start.getTime() + input.durationMinutes * 60 * 1000);
  const date = formatSalonDate(start);

  try {
    const busy = hasGoogleCalendarConfig()
      ? await listBusyGoogle(date)
      : listBusyMemory(date);
    const conflict = busy.some((interval) => overlaps({ start, end }, interval));
    if (conflict) {
      logger.warn("Appointment rejected because the slot is taken", {
        start: formatSalonDateTime(start),
      });
      return {
        success: false,
        startDateTime: formatSalonDateTime(start),
        endDateTime: formatSalonDateTime(end),
        message: "Bu saat dolu. Lütfen checkAvailability ile başka bir saat seçin.",
      };
    }

    if (hasGoogleCalendarConfig()) {
      const env = getEnv();
      const calendar = calendarClient();
      const response = await calendar.events.insert({
        calendarId: env.GOOGLE_CALENDAR_ID,
        requestBody: {
          summary: `${input.serviceName} — ${input.customerName}`,
          description: `Telefon: ${input.customerPhone}\nHizmet: ${input.serviceName}`,
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

      const eventId = response.data.id ?? undefined;
      logger.info("Created Google Calendar event", { eventId });
      return {
        success: true,
        eventId,
        startDateTime: formatSalonDateTime(start),
        endDateTime: formatSalonDateTime(end),
        message: "Randevu Google Takvim'e yazıldı.",
      };
    }

    memoryBusy.push({ start, end });
    const eventId = `mem_${start.getTime()}`;
    logger.info("Created in-memory appointment", { eventId });
    return {
      success: true,
      eventId,
      startDateTime: formatSalonDateTime(start),
      endDateTime: formatSalonDateTime(end),
      message: "Randevu yerel takvime yazıldı (Google kimlik bilgisi yok).",
    };
  } catch (error) {
    logger.error("createAppointment failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

export const calendarToolSchemas = {
  checkAvailability: checkAvailabilityInput,
  createAppointment: createAppointmentInput,
};
