import { NextRequest, NextResponse } from "next/server";
import { upsertVaultUser, getVaultUserByPan } from "@/lib/db/postgres";
import { requireSession } from "@/lib/server/context";
import { ownsPan } from "@/lib/server/session";

/**
 * The vault profile record. Owner-scoped since 2026-09-05 (plan.md §2: "GET
 * accepts PAN; POST accepts identity data without session ownership checks —
 * secure the existing route before exposing it to an autonomous workflow").
 * A caller reads and writes exactly one PAN: the one on their server session.
 */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const pan = searchParams.get("pan") ?? guard.session.owner.pan;
  if (!ownsPan(guard.session, pan)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const result = await getVaultUserByPan(pan);
  return NextResponse.json({
    ok: result.ok,
    user: result.user || null,
    dbStatus: result.isFallback ? "fallback_mode" : "connected",
    error: result.error,
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const { pan, fullName, aadhaar, mobile, email, dateOfBirth, assessmentYear, status, vaultData } = body;

    if (!pan || !fullName) {
      return NextResponse.json(
        { ok: false, error: "PAN and Full Name are required" },
        { status: 400 }
      );
    }

    const cleanPan = String(pan).trim().toUpperCase();
    if (!ownsPan(guard.session, cleanPan)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const result = await upsertVaultUser({
      id: `vault_${cleanPan}_${Date.now()}`,
      pan: cleanPan,
      aadhaar: aadhaar ? String(aadhaar).replace(/\s+/g, "") : null,
      full_name: fullName,
      mobile: mobile || null,
      email: email || null,
      date_of_birth: dateOfBirth || null,
      assessment_year: assessmentYear || "2026-27",
      status: status || "active",
      vault_data: vaultData || {},
    });

    const isPostgresActive = result.ok && !result.isFallback;

    return NextResponse.json({
      ok: true,
      syncedToPostgres: isPostgresActive,
      dbStatus: isPostgresActive ? "postgresql_active" : "client_fallback",
      user: result.user || {
        id: `local_${cleanPan}`,
        pan: cleanPan,
        aadhaar,
        full_name: fullName,
        mobile,
        email,
        date_of_birth: dateOfBirth,
        assessment_year: assessmentYear || "2026-27",
        status: "active",
        vault_data: vaultData || {},
      },
      message: isPostgresActive
        ? "Stored in the cloud Tax Vault"
        : "No database is configured; kept in this browser only",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
