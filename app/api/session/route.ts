import { NextResponse, type NextRequest } from "next/server";
import { getServices, isSecureRequest } from "@/lib/server/context";
import { clearedSessionCookie } from "@/lib/server/session";

/** Who am I, per the server. The client copy of a session is never the authority. */
export async function GET(req: NextRequest) {
  const { sessions, dbConfigured } = await getServices();
  const session = await sessions.resolve(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    owner: session.owner,
    kind: session.kind,
    expiresAt: session.expiresAt,
    // Stated so the UI can say "this demo session ends when the server restarts".
    durable: dbConfigured,
  });
}

/** Sign out. Always 204: an endpoint that errors on an unknown cookie is a way to enumerate real ones. */
export async function DELETE(req: NextRequest) {
  const { sessions } = await getServices();
  await sessions.revoke(req.headers.get("cookie"));
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Set-Cookie", clearedSessionCookie(isSecureRequest(req)));
  return res;
}
