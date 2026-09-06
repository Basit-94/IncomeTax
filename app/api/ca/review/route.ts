import { NextRequest, NextResponse } from "next/server";
import type { CAReviewRecord } from "@/lib/ca/ca-store";

// Global in-memory review map to allow multi-device sharing across browsers during demo
const reviewMemoryStore = new Map<string, CAReviewRecord>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ ok: false, error: "Access Code is required" }, { status: 400 });
  }

  const record = reviewMemoryStore.get(code);
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
      return NextResponse.json({ ok: true, record });
    }

    if (action === "review" && record?.code) {
      const cleanCode = String(record.code).toUpperCase().trim();
      reviewMemoryStore.set(cleanCode, record);
      return NextResponse.json({ ok: true, record });
    }

    if (action === "accept" && code) {
      const cleanCode = String(code).toUpperCase().trim();
      const existing = reviewMemoryStore.get(cleanCode);
      if (existing) {
        existing.status = "accepted";
        reviewMemoryStore.set(cleanCode, existing);
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
