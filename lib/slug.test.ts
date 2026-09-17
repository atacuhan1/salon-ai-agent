import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify } from "@/lib/slug";

test("turkish characters become ascii slugs", () => {
  assert.equal(slugify("Lale Güzellik"), "lale-guzellik");
  assert.equal(slugify("Şömine Nail"), "somine-nail");
});
