import { NextResponse, type NextRequest } from "next/server";
import { cancelRun, publicRun } from "@/lib/agentic/runtime";
import { requireSession, runtimeFor } from "@/lib/server/context";

/** Stop a run. Pending questions and cards are dropped; nothing already applied is undone. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const { id } = await ctx.params;
  const run = await cancelRun(deps, guard.session.owner, id);
  if (!run) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, run: publicRun(run) });
}
