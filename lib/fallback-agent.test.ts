import assert from "node:assert/strict";
import { test } from "node:test";
import { inferDate, runFallbackAgent } from "@/lib/fallback-agent";
import { formatHumanSalonDate } from "@/lib/timezone";

const sunday = "2026-09-13";

test("dün is yesterday, not leftover yarın", () => {
  assert.equal(inferDate("Dün", sunday), "2026-09-12");
});

test("haftaya salı is Tuesday of next calendar week", () => {
  assert.equal(inferDate("haftaya salı", sunday), "2026-09-15");
});

test("yarın stays tomorrow", () => {
  assert.equal(inferDate("Yarın protez tırnak için müsait misiniz?", sunday), "2026-09-14");
});

test("salı alone is the upcoming Tuesday", () => {
  assert.equal(inferDate("salı", sunday), "2026-09-15");
});

test("pazartesi is not parsed as pazar", () => {
  assert.equal(inferDate("pazartesi", sunday), "2026-09-14");
});

test("haftaya without weekday is +7 days", () => {
  assert.equal(inferDate("haftaya", sunday), "2026-09-20");
});

test("follow-up Dün does not reuse yarın slots", async () => {
  const result = await runFallbackAgent(
    [
      { role: "user", content: "Yarın protez tırnak için müsait misiniz?" },
      { role: "assistant", content: "2026-09-14 için Protez Tırnak müsait saatler: 10:00" },
    ],
    "Dün",
    "test-dun",
  );
  assert.equal(result.toolCalls.includes("checkAvailability"), false);
  assert.match(result.reply, /geçmiş/i);
});

test("follow-up haftaya salı uses that Tuesday", async () => {
  const expected = inferDate("haftaya salı");
  assert.ok(expected);
  const result = await runFallbackAgent(
    [
      { role: "user", content: "Yarın protez tırnak için müsait misiniz?" },
      { role: "assistant", content: "2026-09-14 için Protez Tırnak müsait saatler: 10:00" },
    ],
    "haftaya salı",
    "test-salı",
  );
  assert.ok(result.toolCalls.includes("checkAvailability"));
  assert.ok(result.reply.includes(formatHumanSalonDate(expected)));
  assert.doesNotMatch(result.reply, /14 Eylül 2026/);
});
