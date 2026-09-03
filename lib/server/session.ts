/**
 * Cookie ↔ user, for layouts and route handlers. The cookie holds the raw session token;
 * the database holds only its hash (lib/server/auth.ts).
 */
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { authenticate, seedDemoAccount, type User } from "./auth";

export const SESSION_COOKIE = "wapsi_session";

let seeded = false;
function ensureSeeded(): void {
  if (seeded) return;
  seeded = true;
  seedDemoAccount();
}

export function sessionCookieOptions(): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Number(process.env.SESSION_TTL_DAYS || 30) * 86_400,
  };
}

/** Server components and route handlers using next/headers. */
export async function currentUser(): Promise<User | null> {
  ensureSeeded();
  const store = await cookies();
  return authenticate(store.get(SESSION_COOKIE)?.value);
}

/** Route handlers that already hold the NextRequest. */
export function userFromRequest(request: NextRequest): User | null {
  ensureSeeded();
  return authenticate(request.cookies.get(SESSION_COOKIE)?.value);
}

/** Where a signed-in user belongs right now. */
export function homeFor(user: User): string {
  if (!user.onboardedAt) return "/welcome";
  return user.mode === "manual" ? "/" : "/app";
}
