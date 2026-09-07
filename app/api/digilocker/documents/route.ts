import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/context";

/** The locker's catalogue for the session's PAN — titles, issuers, scope — without the fields. Owner-scoped. */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const ay = req.nextUrl.searchParams.get("assessmentYear") ?? "2026-27";
  const scope = req.nextUrl.searchParams.get("scope");
  const documents = (await guard.services.locker.documents(guard.session.owner, ay)).filter((d) => !scope || scope === "all" || d.scope === scope);
  return NextResponse.json({ ok: true, documents });
}
