import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isSameOriginRequest,
  rejectIfCrossOrigin,
} from "@/lib/request-origin";

function withNodeEnv(value: string, fn: () => void) {
  const prev = process.env.NODE_ENV;
  try {
    Object.defineProperty(process.env, "NODE_ENV", {
      value,
      configurable: true,
      writable: true,
      enumerable: true,
    });
    fn();
  } finally {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: prev,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }
}

function request(
  url: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(url, { method: "POST", headers });
}

test("isSameOriginRequest accepts matching Origin", () => {
  withNodeEnv("production", () => {
    const ok = isSameOriginRequest(
      request("https://app.example/api/salon", {
        origin: "https://app.example",
      }),
    );
    assert.equal(ok, true);
  });
});

test("isSameOriginRequest rejects mismatched Origin", () => {
  withNodeEnv("production", () => {
    const ok = isSameOriginRequest(
      request("https://app.example/api/salon", {
        origin: "https://evil.example",
      }),
    );
    assert.equal(ok, false);
  });
});

test("isSameOriginRequest falls back to Referer when Origin missing", () => {
  withNodeEnv("production", () => {
    const ok = isSameOriginRequest(
      request("https://app.example/api/salon", {
        referer: "https://app.example/panel",
      }),
    );
    assert.equal(ok, true);

    const bad = isSameOriginRequest(
      request("https://app.example/api/salon", {
        referer: "https://evil.example/panel",
      }),
    );
    assert.equal(bad, false);
  });
});

test("isSameOriginRequest rejects missing Origin/Referer in production", () => {
  withNodeEnv("production", () => {
    assert.equal(
      isSameOriginRequest(request("https://app.example/api/salon")),
      false,
    );
  });
});

test("isSameOriginRequest allows missing Origin/Referer in development", () => {
  withNodeEnv("development", () => {
    assert.equal(
      isSameOriginRequest(request("http://localhost:3000/api/salon")),
      true,
    );
  });
});

test("isSameOriginRequest treats Origin null as missing", () => {
  withNodeEnv("production", () => {
    assert.equal(
      isSameOriginRequest(
        request("https://app.example/api/salon", { origin: "null" }),
      ),
      false,
    );
  });
});

test("rejectIfCrossOrigin returns 403 JSON when blocked", () => {
  withNodeEnv("production", () => {
    const response = rejectIfCrossOrigin(
      request("https://app.example/api/salon", {
        origin: "https://evil.example",
      }),
    );
    assert.ok(response);
    assert.equal(response!.status, 403);
  });
});

test("rejectIfCrossOrigin returns null when allowed", () => {
  withNodeEnv("production", () => {
    const response = rejectIfCrossOrigin(
      request("https://app.example/api/salon", {
        origin: "https://app.example",
      }),
    );
    assert.equal(response, null);
  });
});
