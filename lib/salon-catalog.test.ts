import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultCatalog,
  effectiveWorkingHours,
  hoursFromRecords,
  keywordsFromName,
} from "@/lib/salon-catalog";
import { generateAvailableSlots } from "@/lib/slots";
import { findService } from "@/prompts/salon-rules";

test("custom service names are found from keywords", () => {
  const service = findService("kaş alımı istiyorum", [
    {
      id: "1",
      name: "Kaş Alımı",
      durationMinutes: 20,
      priceTry: 250,
      keywords: keywordsFromName("Kaş Alımı"),
    },
  ]);
  assert.equal(service?.name, "Kaş Alımı");
});

test("staff-off weekday becomes closed even if salon hours exist", () => {
  const catalog = {
    ...defaultCatalog,
    workingHours: hoursFromRecords([
      { weekday: 0, openTime: null, closeTime: null },
      { weekday: 1, openTime: "10:00", closeTime: "19:00" },
      { weekday: 2, openTime: "10:00", closeTime: "19:00" },
      { weekday: 3, openTime: "10:00", closeTime: "19:00" },
      { weekday: 4, openTime: "10:00", closeTime: "19:00" },
      { weekday: 5, openTime: "10:00", closeTime: "19:00" },
      { weekday: 6, openTime: "10:00", closeTime: "18:00" },
    ]),
    staff: [
      {
        id: "s1",
        name: "Ayşe",
        weekdays: [1, 3, 5],
        open: "10:00",
        close: "19:00",
        active: true,
      },
    ],
  };
  const hours = effectiveWorkingHours(catalog);
  assert.equal(hours[2], null);
  assert.ok(hours[1]);
  assert.deepEqual(generateAvailableSlots("2026-09-15", 60, [], hours), []);
  assert.ok(generateAvailableSlots("2026-09-14", 60, [], hours).includes("10:00"));
});
