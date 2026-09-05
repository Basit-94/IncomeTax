import { NextResponse, type NextRequest } from "next/server";
import { requireSession, storageUnavailable } from "@/lib/server/context";

/** Re-run the parser on a stored original. Only useful after a parser upgrade or for a legacy import. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  if (!guard.services.vault) return storageUnavailable();

  const { id } = await ctx.params;
  const extraction = await guard.services.vault.reextract(guard.session.owner, id);
  if (!extraction) {
    return NextResponse.json({ ok: false, error: "no_original" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, extraction });
}
