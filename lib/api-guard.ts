import { NextResponse } from "next/server";
import { requireSalon } from "@/lib/auth";
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
    throw new HttpError(402, "Abonelik aktif değil. Lütfen ödemeyi tamamlayın.");
  }
  return { salon, access };
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
