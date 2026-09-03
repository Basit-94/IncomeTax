import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { deleteRun, getRun, loadEvents } from "@/lib/harness/runs";

/** Replay a run: its events in order (plan §7 "reload mid-run"). */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const run = getRun(user.id, id);
  if (!run) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const after = Number(request.nextUrl.searchParams.get("after") ?? 0);
  return NextResponse.json({ run: { id: run.id, title: run.title, taskId: run.taskId, status: run.status, updatedAt: run.updatedAt }, events: loadEvents(run.id, after) });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  return NextResponse.json({ deleted: deleteRun(user.id, id) });
}
