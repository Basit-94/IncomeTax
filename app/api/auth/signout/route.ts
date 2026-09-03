import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/server/auth";
import { SESSION_COOKIE } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  destroySession(request.cookies.get(SESSION_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
