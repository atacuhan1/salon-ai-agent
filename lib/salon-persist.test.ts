import assert from "node:assert/strict";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

test("salon rows survive a new Prisma client (Postgres)", async () => {
  const email = `persist-${Date.now()}@example.com`;
  const slug = `persist-${Date.now()}`;
  const created = await prisma.salon.create({
    data: {
      name: "Kalıcı Salon",
      email,
      slug,
      passwordHash: "test-hash",
      subscriptionStatus: "trial",
      trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
    },
  });

  const fresh = new PrismaClient();
  try {
    const found = await fresh.salon.findUnique({ where: { id: created.id } });
    assert.equal(found?.email, email);
    assert.equal(found?.slug, slug);
    assert.equal(found?.name, "Kalıcı Salon");
  } finally {
    await prisma.salon.delete({ where: { id: created.id } }).catch(() => undefined);
    await fresh.$disconnect();
  }
});
