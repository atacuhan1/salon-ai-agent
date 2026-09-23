import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { rejectIfCrossOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  const blocked = rejectIfCrossOrigin(request);
  if (blocked) return blocked;
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
