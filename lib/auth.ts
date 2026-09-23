import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { authSecretKey } from "@/lib/auth-secret";
import { prisma } from "@/lib/db";

const SESSION_DAYS = 7;

function secretKey(): Uint8Array {
  return authSecretKey();
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function createSessionToken(payload: {
  salonId: string;
  slug: string;
  email: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<{
  salonId: string;
  slug: string;
  email: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.salonId !== "string" ||
      typeof payload.slug !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return {
      salonId: payload.salonId,
      slug: payload.slug,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{
  salonId: string;
  slug: string;
  email: string;
} | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return readSessionToken(token);
}

export async function requireSalon() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return prisma.salon.findUnique({
    where: { id: session.salonId },
    include: {
      services: { orderBy: { sortOrder: "asc" } },
      staff: { orderBy: { name: "asc" } },
      hours: { orderBy: { weekday: "asc" } },
    },
  });
}
