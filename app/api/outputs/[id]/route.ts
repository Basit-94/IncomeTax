import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { getOutput } from "@/lib/harness/runs";

/** Files the assistant produced (plan task 5.1): the ITR JSON, the ITR-V, receipts. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const output = getOutput(user.id, id);
  if (!output) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const inline = request.nextUrl.searchParams.get("download") !== "1";
  const safeFilename = output.meta.name.replace(/[/\\?%*:|"<>]/g, "-").replace(/[\x00-\x1f\x80-\x9f\r\n]/g, "").slice(0, 120) || "download";
  return new NextResponse(new Uint8Array(output.bytes), {
    headers: {
      "Content-Type": output.meta.contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeFilename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
