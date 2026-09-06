import { NextRequest, NextResponse } from "next/server";
import { type CAReviewRecord, loadLocalReviews, saveLocalReviews } from "@/lib/ca/ca-store";
import { getServices } from "@/lib/server/context";
import { CURRENT_VERSION } from "@/lib/return/persist";
import type { ReturnState } from "@/lib/return/state";
import type { Owner } from "@/lib/server/session";

// Global in-memory review map to allow multi-device sharing across browsers during demo
const reviewMemoryStore = new Map<string, CAReviewRecord>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ ok: false, error: "Access Code is required" }, { status: 400 });
  }

  const record = reviewMemoryStore.get(code) || loadLocalReviews()[code];
  if (!record) {
    return NextResponse.json({ ok: false, error: "Review draft not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, record });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, record, code } = body;

    if (action === "create" && record?.code) {
      const cleanCode = String(record.code).toUpperCase().trim();
      reviewMemoryStore.set(cleanCode, record);
      const local = loadLocalReviews();
      local[cleanCode] = record;
      saveLocalReviews(local);
      return NextResponse.json({ ok: true, record });
    }

    if (action === "review" && record?.code) {
      const cleanCode = String(record.code).toUpperCase().trim();
      reviewMemoryStore.set(cleanCode, record);
      const local = loadLocalReviews();
      local[cleanCode] = record;
      saveLocalReviews(local);

      // Proactively update the server return snapshot for this citizen so that
      // all engine computations, agentic runs, and challan payments instantly reflect the CA's numbers!
      try {
        const services = await getServices();
        const pan = (record.citizenPan || "").toUpperCase().trim();
        if (pan && record.caPersona) {
          const owner: Owner = {
            pan,
            kind: pan.startsWith("DEM") ? "demo" : "citizen",
            displayName: record.citizenName || pan,
          };
          const store = services.returns ?? services.demoReturns;
          if (store) {
            const existing = await store.get(owner, "2026-27");
            const baseState: ReturnState = existing?.state ?? {
              version: CURRENT_VERSION,
              lang: "en",
              personaId: record.caPersona.id || "custom",
              baselinePersona: record.originalPersona || record.caPersona,
              persona: record.caPersona,
              corrections: [],
              confirmedFactIds: [],
              regime: record.caRegime || "new",
            };
            const updatedState: ReturnState = {
              ...baseState,
              persona: record.caPersona,
              regime: record.caRegime || baseState.regime || "new",
            };
            await store.replace(owner, "2026-27", updatedState, null);
          }
        }
      } catch (err) {
        console.warn("[ca/review] Background server return update failed:", err);
      }

      return NextResponse.json({ ok: true, record });
    }

    if (action === "accept" && code) {
      const cleanCode = String(code).toUpperCase().trim();
      const existing = reviewMemoryStore.get(cleanCode) || loadLocalReviews()[cleanCode];
      if (existing) {
        existing.status = "accepted";
        reviewMemoryStore.set(cleanCode, existing);
        const local = loadLocalReviews();
        local[cleanCode] = existing;
        saveLocalReviews(local);
      }
      return NextResponse.json({ ok: true, record: existing });
    }

    return NextResponse.json({ ok: false, error: "Invalid action or payload" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
