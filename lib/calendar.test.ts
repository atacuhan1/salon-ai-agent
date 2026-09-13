import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppointment } from "@/lib/calendar";

test("rejects an overlapping in-memory appointment", async () => {
  const first = await createAppointment(
    "Ayşe",
    "05551112233",
    "Protez Tırnak",
    "2026-09-16T11:00",
    120,
  );
  assert.equal(first.success, true);

  const second = await createAppointment(
    "Elif",
    "05552223344",
    "Protez Tırnak",
    "2026-09-16T11:30",
    120,
  );
  assert.equal(second.success, false);
  assert.match(second.message, /dolu/i);
});
