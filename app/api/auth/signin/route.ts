import { NextResponse, type NextRequest } from "next/server";
import { seedDemoAccount, signIn } from "@/lib/server/auth";
import { homeFor, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/session";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { publicUser } from "../public-user";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`signin:${ip}`, 5, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many sign-in attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.resetSeconds) } },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  if (typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  seedDemoAccount();
  const result = signIn(body.username, body.password);
  if (!result.ok) {
    return NextResponse.json({ error: result.failure }, { status: result.failure === "locked" ? 429 : 401 });
  }
  const res = NextResponse.json({ user: publicUser(result.user), next: homeFor(result.user) });
  res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
  return res;
}
