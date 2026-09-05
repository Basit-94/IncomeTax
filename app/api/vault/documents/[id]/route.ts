import { NextResponse, type NextRequest } from "next/server";
import { requireSession, storageUnavailable } from "@/lib/server/context";

type Ctx = { params: Promise<{ id: string }> };

/** Metadata plus the extraction record. A foreign id is a 404, exactly like a missing one. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  if (!guard.services.vault) return storageUnavailable();

  const { id } = await ctx.params;
  const meta = await guard.services.vault.getMeta(guard.session.owner, id);
  if (!meta) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const extraction = await guard.services.vault.getExtraction(guard.session.owner, id);
  return NextResponse.json({ ok: true, document: meta, extraction });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  if (!guard.services.vault) return storageUnavailable();

  const { id } = await ctx.params;
  const ok = await guard.services.vault.remove(guard.session.owner, id);
  return ok
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
}
