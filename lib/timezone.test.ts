import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDaysToSalonDate,
  formatSalonDateTime,
  parseStartDateTime,
  salonDateTime,
  weekdayInSalon,
} from "@/lib/timezone";

test("Istanbul weekday for a known Monday", () => {
  assert.equal(weekdayInSalon("2026-09-14"), 1);
});

test("addDays stays on the Istanbul calendar", () => {
  assert.equal(addDaysToSalonDate("2026-09-14", 1), "2026-09-15");
});

test("parseStartDateTime treats naive strings as Istanbul", () => {
  const parsed = parseStartDateTime("2026-09-14T14:00");
  assert.equal(parsed.getTime(), salonDateTime("2026-09-14", "14:00").getTime());
  assert.equal(formatSalonDateTime(parsed), "2026-09-14 14:00");
});
