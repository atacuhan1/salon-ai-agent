import { NextResponse } from "next/server";

/**
 * Same-origin check for cookie-authenticated mutating APIs (CSRF defense-in-depth).
 * Prefers Origin; falls back to Referer. Expected origin comes from Host /
 * X-Forwarded-* (browser view), not only request.url (which Next may rewrite).
 * In production, missing/mismatched values fail.
 * In development, missing Origin/Referer is allowed for local tooling.
 */

function headerOrigin(value: string | null): string | null {
  if (!value || value === "null") {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Origin the browser thinks it is talking to (Host / forwarded headers). */
export function expectedRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host =
    forwardedHost || request.headers.get("host")?.trim() || url.host;
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = (forwardedProto || url.protocol.replace(":", "")).replace(
    /:$/,
    "",
  );
  return `${protocol}://${host}`;
}

export function isSameOriginRequest(
  request: Request,
  options?: { allowMissingInDev?: boolean },
): boolean {
  const expected = expectedRequestOrigin(request);
  const origin = headerOrigin(request.headers.get("origin"));
  if (origin) {
    return origin === expected;
  }

  const referer = headerOrigin(request.headers.get("referer"));
  if (referer) {
    return referer === expected;
  }

  const allowMissing =
    options?.allowMissingInDev ?? process.env.NODE_ENV !== "production";
  return allowMissing;
}

/** Returns a 403 response when the request is not same-origin; otherwise null. */
export function rejectIfCrossOrigin(request: Request): NextResponse | null {
  if (isSameOriginRequest(request)) {
    return null;
  }
  return NextResponse.json(
    { error: "Geçersiz istek kaynağı." },
    { status: 403 },
  );
}
