import assert from "node:assert/strict";
import { test } from "node:test";
import { needsAvailabilityCheck } from "@/lib/openai";

test("haftaya salı + service requires checkAvailability", () => {
  assert.equal(needsAvailabilityCheck("haftaya salı kalıcı oje", []), true);
});

test("dün does not force availability", () => {
  assert.equal(needsAvailabilityCheck("Dün", []), false);
});

test("greeting does not force availability", () => {
  assert.equal(needsAvailabilityCheck("Merhaba", []), false);
});
