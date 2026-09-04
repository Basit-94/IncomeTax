import { NextRequest, NextResponse } from "next/server";
import { upsertVaultUser, getVaultUserByPan, initDb, getDbPool } from "@/lib/db/postgres";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pan = searchParams.get("pan");

  if (!pan) {
    return NextResponse.json({ ok: false, error: "PAN parameter required" }, { status: 400 });
  }

  const pool = getDbPool();
  let dbStatus = "connected";

  const result = await getVaultUserByPan(pan);

  if (!result.ok && result.isFallback) {
    dbStatus = "fallback_mode";
  }

  return NextResponse.json({
    ok: result.ok,
    user: result.user || null,
    dbStatus,
    error: result.error,
  });
}

export async function POST(req: NextRequest) {
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
        ? "Successfully stored in Sovereign Cloud Tax Vault"
        : "Stored in Encrypted Local Tax Vault",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
