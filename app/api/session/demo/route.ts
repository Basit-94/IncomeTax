import { NextResponse, type NextRequest } from "next/server";
import { getServices, isSecureRequest } from "@/lib/server/context";
import { sessionCookie } from "@/lib/server/session";

/**
 * A server-managed demo session for one of the three synthetic personas
 * (plan.md §3.2: "For standalone demonstrations, issue server-managed demo
 * sessions isolated to synthetic fixture data"). Anyone may ask; the session
 * can only ever reach demo-owned rows.
 */
export async function POST(req: NextRequest) {
  let body: { personaId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (typeof body.personaId !== "string") {
    return NextResponse.json({ ok: false, error: "personaId required" }, { status: 400 });
  }
  const { sessions } = await getServices();
  const session = await sessions.issueDemo(body.personaId);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unknown_persona", message: "Demo sessions exist only for the seeded personas." },
      { status: 404 },
    );
  }
  const res = NextResponse.json({ ok: true, owner: session.owner, kind: session.kind, expiresAt: session.expiresAt });
  res.headers.set("Set-Cookie", sessionCookie(session, isSecureRequest(req)));
  return res;
}
