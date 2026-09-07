import { NextResponse, type NextRequest } from "next/server";
import { getVaultUserByPan, upsertVaultUser } from "@/lib/db/postgres";
import { requireSession } from "@/lib/server/context";

/**
 * Link / unlink the (mock) DigiLocker for the session's PAN (Phase C seam, 2026-09-07).
 *
 * Linking is the permission step onboarding shows once; every later pull still shows its own consent
 * card. On link, the identity the locker holds is written to the person's Tax Vault record when a
 * database exists — merged, never clobbering the documents already there — so the vault's PAN and
 * Aadhaar cards show the same person the rest of Wapsi now knows.
 */
export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const owner = guard.session.owner;
  const record = await guard.services.locker.link(owner);
  const profile = await guard.services.locker.profile(owner);
  let vaultSynced = false;
  if (guard.services.pool) {
    const existing = await getVaultUserByPan(owner.pan);
    const prior = existing.ok && existing.user ? existing.user : null;
    const priorData = (prior?.vault_data ?? {}) as Record<string, unknown>;
    const a = record.identity.address;
    const r = await upsertVaultUser({
      id: prior?.id ?? `vault_${owner.pan}_${Date.now()}`,
      pan: owner.pan,
      aadhaar: record.identity.aadhaar.replace(/(\d{4})(?=\d)/g, "$1 "),
      full_name: record.identity.name,
      mobile: record.identity.mobile,
      email: record.identity.email,
      date_of_birth: record.identity.dob,
      assessment_year: prior?.assessment_year ?? "2026-27",
      status: "verified",
      vault_data: { ...priorData, address: `${a.line}, ${a.city}, ${a.state} ${a.pin}`, banks: record.banks, digilocker: { linked: true, linkedAt: record.linkedAt } },
    });
    vaultSynced = r.ok && !r.isFallback;
  }
  return NextResponse.json({ ok: true, status: { linked: record.linked, linkedAt: record.linkedAt }, profile, vaultSynced, durable: guard.services.dbConfigured });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  await guard.services.locker.unlink(guard.session.owner);
  return NextResponse.json({ ok: true, status: { linked: false } });
}
