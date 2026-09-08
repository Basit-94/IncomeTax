import { NextRequest, NextResponse } from "next/server";
import { type CAReviewRecord } from "@/lib/ca/ca-store";
import { mirrorLegacy, publicReview, submitReview } from "@/lib/ca/server-actions";
import { resolveCa, type CAReviewRequest } from "@/lib/ca/server-store";
import { getServices } from "@/lib/server/context";

/**
 * The own-CA flow's route (code + PIN, link, WhatsApp), kept as it was for the client that already calls it —
 * but since 2026-09-08 it writes through to the CA system's server store, so a return shared this way and one
 * broadcast to every registered CA live in the same place and show up in the same inbox and sidebar.
 */
export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ ok: false, error: "Access Code is required" }, { status: 400 });
  const services = await getServices();
  const record = await services.caStore.getReview(code);
  if (!record) return NextResponse.json({ ok: false, error: "Review draft not found" }, { status: 404 });
  // The PIN hash travels here on purpose: the CA portal verifies the PIN client-side, as it always has.
  return NextResponse.json({ ok: true, record, comments: await services.caStore.listComments(code) });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { action?: string; record?: CAReviewRecord & Partial<CAReviewRequest>; code?: string };
    const { action, record, code } = body;
    const services = await getServices();
    const now = new Date().toISOString();

    if (action === "create" && record?.code) {
      const review: CAReviewRequest = { ...record, code: String(record.code).toUpperCase().trim(), mode: record.mode ?? "own", updatedAt: now };
      await services.caStore.putReview(review);
      mirrorLegacy(review);
      return NextResponse.json({ ok: true, record: review });
    }

    if (action === "review" && record?.code && record.caPersona) {
      const ca = await resolveCa(services.caStore, req.headers.get("cookie"));
      const existing = await services.caStore.getReview(record.code);
      if (!existing) {
        // A record the client held but the server never saw (a restart): take it whole.
        const review: CAReviewRequest = { ...record, code: String(record.code).toUpperCase().trim(), mode: record.mode ?? "own", updatedAt: now };
        await services.caStore.putReview(review);
        mirrorLegacy(review);
      }
      const result = await submitReview(services.caStore, services.returns ?? services.demoReturns, record.code, { caPersona: record.caPersona, caRegime: record.caRegime ?? record.originalRegime, caNotes: record.caNotes, caDetails: record.caDetails }, ca);
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true, record: result.value });
    }

    if (action === "accept" && code) {
      const existing = await services.caStore.getReview(code);
      if (!existing) return NextResponse.json({ ok: true, record: null });
      const next: CAReviewRequest = { ...existing, status: "accepted", updatedAt: now };
      await services.caStore.putReview(next);
      mirrorLegacy(next);
      return NextResponse.json({ ok: true, record: publicReview(next) });
    }

    return NextResponse.json({ ok: false, error: "Invalid action or payload" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
