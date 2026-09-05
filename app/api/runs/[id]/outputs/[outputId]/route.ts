import { NextResponse, type NextRequest } from "next/server";
import { requireSession, runtimeFor } from "@/lib/server/context";

/** A stored output, for its owner only. Every body carries `synthetic: true` and the snapshot it was built from. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; outputId: string }> }) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const { id, outputId } = await ctx.params;
  const out = await deps.store.getOutput(guard.session.owner, outputId);
  if (!out || out.runId !== id) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return new NextResponse(Buffer.from(out.body), {
    headers: {
      "Content-Type": out.mimeType,
      "Content-Disposition": `attachment; filename="wapsi-${out.kind}-${out.snapshotRevision}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
