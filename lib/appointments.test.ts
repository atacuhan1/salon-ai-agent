import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkAvailability,
  createAppointment,
  listAppointmentsForDay,
} from "@/lib/calendar";
import { prisma } from "@/lib/db";
import { SUBSCRIPTION_STATUS } from "@/lib/subscription";
import { formatSalonDate, salonDateTime } from "@/lib/timezone";

test("persisted salon appointments survive and block overlaps", async () => {
  const stamp = Date.now();
  const salon = await prisma.salon.create({
    data: {
      name: "Randevu Test",
      email: `appt-${stamp}@example.com`,
      slug: `appt-${stamp}`,
      passwordHash: "test-hash",
      subscriptionStatus: SUBSCRIPTION_STATUS.trial,
      trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
      whatsappPhoneNumberId: `999${stamp}`.slice(0, 15),
      googleCalendarId: null,
    },
  });

  // Far-future weekday so working-hours defaults do not matter for conflict checks.
  const start = salonDateTime("2027-03-15", "11:00");
  const date = formatSalonDate(start);

  try {
    const first = await createAppointment(
      "Ayşe",
      "05551112233",
      "Protez Tırnak",
      "2027-03-15T11:00",
      120,
      { salonKey: salon.id },
    );
    assert.equal(first.success, true);
    assert.ok(first.eventId);

    const second = await createAppointment(
      "Elif",
      "05552223344",
      "Protez Tırnak",
      "2027-03-15T11:30",
      120,
      { salonKey: salon.id },
    );
    assert.equal(second.success, false);

    const dayList = await listAppointmentsForDay(salon.id, date);
    assert.equal(dayList.length, 1);
    assert.equal(dayList[0]?.customerName, "Ayşe");
    assert.equal(dayList[0]?.serviceName, "Protez Tırnak");
    assert.equal(dayList[0]?.customerPhone, "05551112233");

    const slots = await checkAvailability(date, 60, { salonKey: salon.id });
    assert.ok(!slots.includes("11:00"));
    assert.ok(!slots.includes("11:30"));
  } finally {
    await prisma.salon.delete({ where: { id: salon.id } }).catch(() => undefined);
  }
});

test("whatsapp phone_number_id maps uniquely to salon", async () => {
  const stamp = Date.now();
  const phoneNumberId = `888${stamp}`.slice(0, 15);
  const salon = await prisma.salon.create({
    data: {
      name: "WA Map",
      email: `wa-${stamp}@example.com`,
      slug: `wa-${stamp}`,
      passwordHash: "test-hash",
      subscriptionStatus: SUBSCRIPTION_STATUS.trial,
      trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
      whatsappPhoneNumberId: phoneNumberId,
    },
  });

  try {
    const found = await prisma.salon.findUnique({
      where: { whatsappPhoneNumberId: phoneNumberId },
    });
    assert.equal(found?.id, salon.id);
  } finally {
    await prisma.salon.delete({ where: { id: salon.id } }).catch(() => undefined);
  }
});
