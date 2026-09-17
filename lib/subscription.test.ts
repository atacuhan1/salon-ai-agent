import assert from "node:assert/strict";
import { test } from "node:test";
import { getAccessState, paidUntilFrom, trialEndsFrom } from "@/lib/subscription";

test("trial is active before the end date", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const access = getAccessState(
    {
      subscriptionStatus: "trial",
      trialEndsAt: trialEndsFrom(now),
      paidUntil: null,
    },
    now,
  );
  assert.equal(access.active, true);
  assert.equal(access.status, "trial");
  assert.equal(access.daysLeft, 14);
});

test("expired trial locks access", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const access = getAccessState(
    {
      subscriptionStatus: "trial",
      trialEndsAt: new Date("2026-09-01T12:00:00Z"),
      paidUntil: null,
    },
    now,
  );
  assert.equal(access.active, false);
  assert.equal(access.status, "expired");
});

test("paid subscription stays open until paidUntil", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const access = getAccessState(
    {
      subscriptionStatus: "active",
      trialEndsAt: new Date("2026-09-01T12:00:00Z"),
      paidUntil: paidUntilFrom(now),
    },
    now,
  );
  assert.equal(access.active, true);
  assert.equal(access.status, "active");
});

test("canceled subscription is locked even if paidUntil is in the future", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const access = getAccessState(
    {
      subscriptionStatus: "canceled",
      trialEndsAt: trialEndsFrom(now),
      paidUntil: paidUntilFrom(now),
    },
    now,
  );
  assert.equal(access.active, false);
  assert.equal(access.status, "canceled");
});
