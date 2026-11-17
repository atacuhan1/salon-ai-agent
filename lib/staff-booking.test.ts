import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppointment } from "@/lib/calendar";
import { runFallbackAgent } from "@/lib/fallback-agent";
import { executeTool } from "@/lib/openai";
import {
  findStaffByName,
  findStaffInText,
  staffWorkingHours,
  type SalonCatalog,
} from "@/lib/salon-catalog";
import { fitsWorkingHours, generateAvailableSlots } from "@/lib/slots";
import { salonDateTime } from "@/lib/timezone";
import type { StaffMember } from "@/lib/types";
import { buildSystemPrompt } from "@/prompts/salon-rules";

// 2027-03-15 is a Monday, 2027-03-16 a Tuesday, 2027-03-20 a Saturday.
const ayse: StaffMember = {
  id: "staff-ayse",
  name: "Ayşe",
  weekdays: [1, 3, 5],
  open: "12:00",
  close: "17:00",
  active: true,
};
const zeynep: StaffMember = {
  id: "staff-zeynep",
  name: "Zeynep Kaya",
  weekdays: [1, 2, 3, 4, 5, 6],
  open: "10:00",
  close: "19:00",
  active: true,
};
const eski: StaffMember = {
  id: "staff-eski",
  name: "Elif",
  weekdays: [1, 2, 3, 4, 5, 6],
  open: "10:00",
  close: "19:00",
  active: false,
};

// id "demo" keeps bookings in memory (no Postgres needed for these tests).
const catalog: SalonCatalog = {
  id: "demo",
  slug: "lale",
  name: "Lale Nail",
  phone: "0212 000 00 00",
  address: "Kadıköy",
  services: [
    {
      id: "mani",
      name: "Manikür",
      durationMinutes: 60,
      priceTry: 500,
      keywords: ["manikür", "manikur"],
    },
  ],
  workingHours: {
    0: null,
    1: { open: "10:00", close: "19:00" },
    2: { open: "10:00", close: "19:00" },
    3: { open: "10:00", close: "19:00" },
    4: { open: "10:00", close: "19:00" },
    5: { open: "10:00", close: "20:00" },
    6: { open: "10:00", close: "18:00" },
  },
  staff: [ayse, zeynep, eski],
};

test("findStaffInText matches Turkish suffixes but not longer names", () => {
  assert.equal(findStaffInText("Ayşe'den randevu alabilir miyim", catalog.staff)?.id, ayse.id);
  assert.equal(findStaffInText("ayşeden olsun", catalog.staff)?.id, ayse.id);
  assert.equal(findStaffInText("zeynep kaya ile pazartesi", catalog.staff)?.id, zeynep.id);
  assert.equal(findStaffInText("Ayşegül hanım var mı", catalog.staff), null);
  assert.equal(findStaffInText("Elif'ten randevu", catalog.staff), null, "inactive staff");
  assert.equal(findStaffInText("yarın manikür", catalog.staff), null);
});

test("findStaffByName is exact, case-insensitive and ignores inactive staff", () => {
  assert.equal(findStaffByName("ayşe", catalog.staff)?.id, ayse.id);
  assert.equal(findStaffByName("ZEYNEP KAYA", catalog.staff)?.id, zeynep.id);
  assert.equal(findStaffByName("Zeynep", catalog.staff), null);
  assert.equal(findStaffByName("Elif", catalog.staff), null);
});

test("staffWorkingHours intersects salon and staff hours", () => {
  const hours = staffWorkingHours(catalog.workingHours, ayse);
  assert.deepEqual(hours[1], { open: "12:00", close: "17:00" });
  assert.equal(hours[2], null, "Ayşe does not work on Tuesday");
  assert.equal(hours[0], null, "salon closed on Sunday");

  const late = staffWorkingHours(
    { ...catalog.workingHours, 6: { open: "10:00", close: "11:00" } },
    { ...ayse, weekdays: [6] },
  );
  assert.equal(late[6], null, "empty intersection is closed");
  assert.equal(staffWorkingHours(catalog.workingHours, eski)[1], null);
});

test("staff hours narrow generated slots", () => {
  const slots = generateAvailableSlots(
    "2027-03-15",
    60,
    [],
    staffWorkingHours(catalog.workingHours, ayse),
  );
  assert.equal(slots[0], "12:00");
  assert.equal(slots.at(-1), "16:00");
  assert.deepEqual(
    generateAvailableSlots("2027-03-16", 60, [], staffWorkingHours(catalog.workingHours, ayse)),
    [],
  );
});

test("fitsWorkingHours checks both ends of the booking", () => {
  const hours = staffWorkingHours(catalog.workingHours, ayse);
  assert.equal(
    fitsWorkingHours(salonDateTime("2027-03-15", "12:00"), salonDateTime("2027-03-15", "13:00"), hours),
    true,
  );
  assert.equal(
    fitsWorkingHours(salonDateTime("2027-03-15", "16:30"), salonDateTime("2027-03-15", "17:30"), hours),
    false,
  );
  assert.equal(
    fitsWorkingHours(salonDateTime("2027-03-16", "12:00"), salonDateTime("2027-03-16", "13:00"), hours),
    false,
  );
});

test("createAppointment refuses a time outside the given hours", async () => {
  const result = await createAppointment(
    "Deniz",
    "05550000001",
    "Manikür",
    "2027-03-16T12:00",
    60,
    {
      salonKey: catalog.id,
      hours: staffWorkingHours(catalog.workingHours, ayse),
      staffMemberId: ayse.id,
    },
  );
  assert.equal(result.success, false);
  assert.equal(result.reason, "outside_hours");
});

test("tool checkAvailability with staff on an off day returns no slots", async () => {
  const result = (await executeTool(
    "checkAvailability",
    JSON.stringify({ date: "2027-03-16", durationMinutes: 60, staffName: "Ayşe" }),
    catalog,
  )) as { staffName: string; staffWorksThatDay: boolean; slots: string[] };
  assert.equal(result.staffName, "Ayşe");
  assert.equal(result.staffWorksThatDay, false);
  assert.deepEqual(result.slots, []);
});

test("tool checkAvailability with staff uses that staff member's hours", async () => {
  const result = (await executeTool(
    "checkAvailability",
    JSON.stringify({ date: "2027-03-17", durationMinutes: 60, staffName: "ayşe" }),
    catalog,
  )) as { staffWorksThatDay: boolean; slots: string[] };
  assert.equal(result.staffWorksThatDay, true);
  assert.equal(result.slots[0], "12:00");
  assert.ok(!result.slots.includes("10:00"));
});

test("tool rejects unknown or inactive staff without booking", async () => {
  const unknown = (await executeTool(
    "createAppointment",
    JSON.stringify({
      customerName: "Deniz",
      customerPhone: "05550000002",
      serviceName: "Manikür",
      startDateTime: "2027-03-17T12:00",
      durationMinutes: 60,
      staffName: "Elif",
    }),
    catalog,
  )) as { error?: string; activeStaff?: string[]; success?: boolean };
  assert.ok(unknown.error);
  assert.equal(unknown.success, undefined);
  assert.deepEqual(unknown.activeStaff, ["Ayşe", "Zeynep Kaya"]);
});

test("fallback says the staff member is off that day", async () => {
  const result = await runFallbackAgent(
    [],
    "16.03.2027 Ayşe'den manikür için müsait saat var mı",
    "staff-1",
    catalog,
  );
  assert.equal(result.toolCalls.length, 0);
  assert.match(result.reply, /Ayşe .* çalışmıyor/);
  assert.match(result.reply, /Pazartesi, Çarşamba, Cuma/);
});

test("fallback availability with staff shows only staff hours", async () => {
  const result = await runFallbackAgent(
    [],
    "15.03.2027 ayşeden manikür müsait mi",
    "staff-2",
    catalog,
  );
  assert.ok(result.toolCalls.includes("checkAvailability"));
  assert.match(result.reply, /Manikür \(Ayşe\)/);
  assert.match(result.reply, /12:00/);
  assert.doesNotMatch(result.reply, /10:00/);
});

test("fallback books with staff remembered from history", async () => {
  const history = [
    { role: "user" as const, content: "19.03.2027 Ayşe'den manikür müsait mi" },
    { role: "assistant" as const, content: "Müsait saatler: 12:00, 13:00" },
  ];
  const outside = await runFallbackAgent(
    history,
    "2027-03-19 saat 10:00 olsun, adım Deniz, 0555 000 00 03",
    "staff-3",
    catalog,
  );
  assert.ok(outside.toolCalls.includes("createAppointment"));
  assert.match(outside.reply, /Ayşe .* çalışmıyor/);

  const ok = await runFallbackAgent(
    history,
    "2027-03-19 saat 13:00 olsun, adım Deniz, 0555 000 00 03",
    "staff-3",
    catalog,
  );
  assert.match(ok.reply, /Randevunuz alındı\. Manikür \(Ayşe\)/);
});

test("system prompt lists staff days and hours", () => {
  const prompt = buildSystemPrompt("2027-03-15", catalog);
  const json = JSON.parse(prompt.split("SALON_DATA_JSON=")[1] ?? "{}") as {
    activeStaff: Array<{ name: string; days: string[]; hours: string }>;
  };
  assert.deepEqual(json.activeStaff[0], {
    name: "Ayşe",
    days: ["Pazartesi", "Çarşamba", "Cuma"],
    hours: "12:00-17:00",
  });
  assert.equal(json.activeStaff.length, 2, "inactive staff hidden");
  assert.match(prompt, /staffName/);
});
