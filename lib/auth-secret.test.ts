import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAuthSecret } from "@/lib/auth-secret";

function withEnv(
  values: { AUTH_SECRET?: string | null; NODE_ENV?: string },
  fn: () => void,
) {
  const prevSecret = process.env.AUTH_SECRET;
  const prevNode = process.env.NODE_ENV;
  try {
    if (values.AUTH_SECRET === null) {
      delete process.env.AUTH_SECRET;
    } else if (values.AUTH_SECRET !== undefined) {
      process.env.AUTH_SECRET = values.AUTH_SECRET;
    }
    if (values.NODE_ENV !== undefined) {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: values.NODE_ENV,
        configurable: true,
        writable: true,
        enumerable: true,
      });
    }
    fn();
  } finally {
    if (prevSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = prevSecret;
    }
    Object.defineProperty(process.env, "NODE_ENV", {
      value: prevNode,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }
}

test("resolveAuthSecret uses strong secret when set", () => {
  withEnv({ AUTH_SECRET: "a".repeat(40), NODE_ENV: "production" }, () => {
    assert.equal(resolveAuthSecret(), "a".repeat(40));
  });
});

test("resolveAuthSecret rejects missing secret in production", () => {
  withEnv({ AUTH_SECRET: null, NODE_ENV: "production" }, () => {
    assert.throws(() => resolveAuthSecret(), /AUTH_SECRET is required/);
  });
});

test("resolveAuthSecret allows dev fallback outside production", () => {
  withEnv({ AUTH_SECRET: null, NODE_ENV: "development" }, () => {
    assert.match(resolveAuthSecret(), /dev-salon-ai/);
  });
});
