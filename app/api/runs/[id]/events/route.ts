import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireSession, runtimeFor } from "@/lib/server/context";

/**
 * Server-sent events with cursor replay (plan.md §5.4: "fetch-streamed SSE
 * with cursor replay/poll fallback"). Events are read from the store, never
 * from process memory, so a reconnect at ?after=N is exact. The stream ends
 * when the run is no longer running (the client polls after that) or after a
 * bounded window, so a serverless function is never asked to live forever.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const { id } = await ctx.params;
  const owner = guard.session.owner;
  const run = await deps.store.getRun(owner, id);
  if (!run) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  let cursor = Number(req.nextUrl.searchParams.get("after") ?? 0) || 0;
  const encoder = new TextEncoder();
  const started = Date.now();
  const WINDOW_MS = 25_000;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        while (Date.now() - started < WINDOW_MS) {
          const events = await deps.store.eventsAfter(owner, id, cursor);
          for (const e of events) {
            send("run_event", e);
            cursor = e.seq;
          }
          const current = await deps.store.getRun(owner, id);
          if (!current || current.status !== "running") {
            send("run_status", { status: current?.status ?? "failed", cursor });
            break;
          }
          await new Promise((r) => setTimeout(r, 400));
        }
        send("cursor", { cursor });
      } finally {
        controller.close();
      }
    },
    cancel() {
      // The client went away; the run is unaffected — it lives in the store.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
