import { NextResponse, type NextRequest } from "next/server";
import { requireSession, returnStoreFor } from "@/lib/server/context";
import type { ReturnState } from "@/lib/return/state";

const AY = "2026-27";

/** The server-owned return for the signed-in owner (plan.md §3.3). */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const store = returnStoreFor(guard.services, guard.session);
  if (!store) return storageUnavailable();
  const snapshot = await store.get(guard.session.owner, AY);
  return NextResponse.json({ ok: true, snapshot, durable: guard.services.dbConfigured });
}

/**
 * The manual journey mirrors its whole local state here after every change,
 * with the revision it last saw. A conflict means the agent wrote in between:
 * the client receives the newer snapshot and adopts it instead of overwriting.
 */
export async function PUT(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const store = returnStoreFor(guard.services, guard.session);
  if (!store) return storageUnavailable();

  let body: { state?: ReturnState; expectedRevision?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const state = body.state;
  if (!state || typeof state !== "object" || !state.persona || !state.baselinePersona || !Array.isArray(state.corrections)) {
    return NextResponse.json({ ok: false, error: "bad_state" }, { status: 400 });
  }
  // The owner test: the return being mirrored must be the session owner's.
  if (state.persona.pan.toUpperCase() !== guard.session.owner.pan) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const expected = typeof body.expectedRevision === "number" ? body.expectedRevision : null;
  const result = await store.replace(guard.session.owner, AY, state, expected);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === "conflict" ? 409 : 400 });
  }
  return NextResponse.json({ ...result, durable: guard.services.dbConfigured });
}

function storageUnavailable() {
  return NextResponse.json(
    { ok: false, error: "storage_unavailable", message: "No database is configured; a verified account's return cannot be stored here." },
    { status: 503 },
  );
}
