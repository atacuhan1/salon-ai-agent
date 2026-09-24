import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireSalon } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getAccessState } from "@/lib/subscription";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireOwner(options?: { allowExpired?: boolean }) {
  const salon = await requireSalon();
  if (!salon) {
    throw new HttpError(401, "Giriş yapmanız gerekiyor.");
  }
  const access = getAccessState(salon);
  if (!options?.allowExpired && !access.active) {
    throw new HttpError(402, "Aboneliğiniz aktif değil. Abonelik sayfasından süreyi yenileyin.");
  }
  return { salon, access };
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}

export function toErrorResponse(
  error: unknown,
  options: {
    zodMessage: string;
    fallbackMessage: string;
    logKey?: string;
  },
) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: options.zodMessage }, { status: 400 });
  }
  if (options.logKey) {
    logger.error(options.logKey, {
      error: error instanceof Error ? error.message : "unknown",
    });
  }
  return NextResponse.json({ error: options.fallbackMessage }, { status: 500 });
}
