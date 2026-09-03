import { NextResponse, type NextRequest } from "next/server";
import { createSession, createUser, isValidUsername, normaliseUsername, UsernameTaken } from "@/lib/server/auth";
import { homeFor, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/session";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { publicUser } from "../public-user";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`signup:${ip}`, 5, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many sign-up attempts. Please try again later." },
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
  const username = normaliseUsername(body.username);
  if (!isValidUsername(username)) return NextResponse.json({ error: "username_shape" }, { status: 400 });
  if (body.password.length < 4) return NextResponse.json({ error: "password_short" }, { status: 400 });
  try {
    const user = createUser(username, body.password);
    const token = createSession(user.id);
    const res = NextResponse.json({ user: publicUser(user), next: homeFor(user) }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (error) {
    if (error instanceof UsernameTaken) return NextResponse.json({ error: "taken" }, { status: 409 });
    return NextResponse.json({ error: "rejected" }, { status: 400 });
  }
}
