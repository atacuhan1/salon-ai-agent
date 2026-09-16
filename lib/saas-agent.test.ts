import assert from "node:assert/strict";
import { test } from "node:test";
import { runFallbackAgent } from "@/lib/fallback-agent";
import type { SalonCatalog } from "@/lib/salon-catalog";

const catalog: SalonCatalog = {
  id: "lale",
  slug: "lale",
  name: "Lale Nail",
  phone: "0212 000 00 00",
  address: "Kadıköy",
  services: [
    {
      id: "kas",
      name: "Kaş Alımı",
      durationMinutes: 20,
      priceTry: 250,
      keywords: ["kaş", "kas", "alımı", "alimi"],
    },
  ],
  workingHours: {
    0: null,
    1: { open: "11:00", close: "16:00" },
    2: { open: "11:00", close: "16:00" },
    3: { open: "11:00", close: "16:00" },
    4: { open: "11:00", close: "16:00" },
    5: { open: "11:00", close: "16:00" },
    6: null,
  },
  staff: [
    {
      id: "ayse",
      name: "Ayşe",
      weekdays: [1, 2, 3, 4, 5],
      open: "11:00",
      close: "16:00",
      active: true,
    },
  ],
};

test("fallback lists tenant services and prices", async () => {
  const result = await runFallbackAgent([], "Hizmetler ve fiyatlar neler?", "saas-1", catalog);
  assert.match(result.reply, /Lale Nail/);
  assert.match(result.reply, /Kaş Alımı/);
  assert.match(result.reply, /250 TL/);
});

test("fallback uses tenant hours for availability", async () => {
  const result = await runFallbackAgent([], "pazartesi kaş alımı", "saas-2", catalog);
  assert.ok(result.toolCalls.includes("checkAvailability"));
  assert.match(result.reply, /11:00/);
  assert.doesNotMatch(result.reply, /10:00/);
});
