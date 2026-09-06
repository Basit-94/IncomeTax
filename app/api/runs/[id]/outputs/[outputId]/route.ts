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
  const isPdf = out.mimeType === "application/pdf" || out.kind === "itrv_acknowledgement_pdf";
  const filename = isPdf
    ? `ITR-V_Acknowledgement_AY2026-27_${out.snapshotHash.slice(0, 8).toUpperCase()}.pdf`
    : `wapsi-${out.kind}-${out.snapshotRevision}.json`;
  return new NextResponse(Buffer.from(out.body), {
    headers: {
      "Content-Type": out.mimeType || (isPdf ? "application/pdf" : "application/json"),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
