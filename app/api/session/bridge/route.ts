import { NextResponse, type NextRequest } from "next/server";
import { getServices, isSecureRequest } from "@/lib/server/context";
import { sessionCookie, verifyBackendToken } from "@/lib/server/session";

/**
 * Exchange a Java backend session for a server-managed HttpOnly session
 * (plan.md §3.2). The backend is asked who owns the token; only its answer
 * becomes the owner. A mock or client-minted token is refused before any
 * network call is made.
 */
export async function POST(req: NextRequest) {
  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (typeof body.token !== "string" || !body.token) {
    return NextResponse.json({ ok: false, error: "token required" }, { status: 400 });
  }
  const backend = process.env.AGENT_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  const verified = await verifyBackendToken(body.token, backend);
  if (!verified.ok) {
    const status = verified.reason === "backend_unreachable" ? 503 : 401;
    return NextResponse.json({ ok: false, error: verified.reason }, { status });
  }
  const { sessions } = await getServices();
  const session = await sessions.issueBridged(verified.owner);
  const res = NextResponse.json({ ok: true, owner: session.owner, kind: session.kind, expiresAt: session.expiresAt });
  res.headers.set("Set-Cookie", sessionCookie(session, isSecureRequest(req)));
  return res;
}
