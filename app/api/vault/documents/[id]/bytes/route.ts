import { NextResponse, type NextRequest } from "next/server";
import { requireSession, storageUnavailable } from "@/lib/server/context";

/** The original file, decrypted for its owner. Metadata-only records have no bytes and answer 404. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  if (!guard.services.vault) return storageUnavailable();

  const { id } = await ctx.params;
  const opened = await guard.services.vault.open(guard.session.owner, id);
  if (!opened) {
    return NextResponse.json(
      { ok: false, error: "no_original", message: "This record has no stored original." },
      { status: 404 },
    );
  }
  const safeName = (opened.meta.filename ?? `${opened.meta.docType}.bin`).replace(/[^\w.\-]+/g, "_");
  return new NextResponse(Buffer.from(opened.bytes), {
    status: 200,
    headers: {
      "Content-Type": opened.meta.mimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
