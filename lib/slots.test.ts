import assert from "node:assert/strict";
import { test } from "node:test";
import { generateAvailableSlots, overlaps } from "@/lib/slots";
import { salonDateTime } from "@/lib/timezone";

test("Sunday is closed", () => {
  assert.deepEqual(generateAvailableSlots("2026-09-13", 60, []), []);
});

test("weekday slots stay inside working hours", () => {
  const slots = generateAvailableSlots("2026-09-14", 120, []);
  assert.equal(slots[0], "10:00");
  assert.equal(slots.at(-1), "17:00");
  assert.ok(slots.includes("14:00"));
});

test("busy intervals remove overlapping starts", () => {
  const busy = [
    {
      start: salonDateTime("2026-09-14", "10:00"),
      end: salonDateTime("2026-09-14", "12:00"),
    },
  ];
  const slots = generateAvailableSlots("2026-09-14", 120, busy);
  assert.ok(!slots.includes("10:00"));
  assert.ok(!slots.includes("10:30"));
  assert.ok(slots.includes("12:00"));
});

test("overlap helper", () => {
  const a = {
    start: salonDateTime("2026-09-14", "10:00"),
    end: salonDateTime("2026-09-14", "12:00"),
  };
  const b = {
    start: salonDateTime("2026-09-14", "11:00"),
    end: salonDateTime("2026-09-14", "13:00"),
  };
  const c = {
    start: salonDateTime("2026-09-14", "12:00"),
    end: salonDateTime("2026-09-14", "14:00"),
  };
  assert.equal(overlaps(a, b), true);
  assert.equal(overlaps(a, c), false);
});
