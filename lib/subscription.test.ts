import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAccessState,
  paidUntilFrom,
  SUBSCRIPTION_STATUS,
  trialEndsFrom,
} from "@/lib/subscription";

test("trial is active before the end date", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const access = getAccessState(
    {
      subscriptionStatus: SUBSCRIPTION_STATUS.trial,
      trialEndsAt: trialEndsFrom(now),
      paidUntil: null,
    },
    now,
  );
  assert.equal(access.active, true);
  assert.equal(access.status, SUBSCRIPTION_STATUS.trial);
  assert.equal(access.daysLeft, 14);
});

test("expired trial locks access", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const access = getAccessState(
    {
      subscriptionStatus: SUBSCRIPTION_STATUS.trial,
      trialEndsAt: new Date("2026-09-01T12:00:00Z"),
      paidUntil: null,
    },
    now,
  );
  assert.equal(access.active, false);
  assert.equal(access.status, SUBSCRIPTION_STATUS.expired);
});

test("paid subscription stays open until paidUntil", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const access = getAccessState(
    {
      subscriptionStatus: SUBSCRIPTION_STATUS.active,
      trialEndsAt: new Date("2026-09-01T12:00:00Z"),
      paidUntil: paidUntilFrom(now),
    },
    now,
  );
  assert.equal(access.active, true);
  assert.equal(access.status, SUBSCRIPTION_STATUS.active);
});

test("canceled subscription is locked even if paidUntil is in the future", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const access = getAccessState(
    {
      subscriptionStatus: SUBSCRIPTION_STATUS.canceled,
      trialEndsAt: trialEndsFrom(now),
      paidUntil: paidUntilFrom(now),
    },
    now,
  );
  assert.equal(access.active, false);
  assert.equal(access.status, SUBSCRIPTION_STATUS.canceled);
});
