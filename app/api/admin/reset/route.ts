import { NextResponse, type NextRequest } from "next/server";
import { getDbPool, isDbConfigured } from "@/lib/db/postgres";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, message: "In-memory database reset" });
  }

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }

  try {
    await pool.query(`
      TRUNCATE TABLE 
        agent_run_events,
        agent_outputs,
        agent_memory,
        agent_budget_usage,
        agent_runs,
        vault_document_bytes,
        vault_extractions,
        vault_access_audit,
        vault_documents,
        return_command_log,
        return_snapshots,
        wapsi_sessions,
        tax_vault_users,
        digilocker_records
      CASCADE;
    `);

    return NextResponse.json({ ok: true, message: "Database tables purged for fresh submission slate" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
