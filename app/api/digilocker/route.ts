import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/server/context";

/**
 * The DigiLocker mock for the two shells that are not the agent (2026-09-07; Phase C seam).
 *
 *  GET  — the standing record (identity, address, banks), the link status and the catalogue of what
 *         the locker holds, for onboarding's "This is you" screen and the papers card.
 *  POST — pull this year's documents (`scope`: `year` default, `identity`, or `all`): imported into the
 *         vault as issued documents when a vault exists, returned with their fields so the page can stage
 *         `import_document` the way the agent does.
 *
 * Owner-scoped: the session's PAN is the only one read. Nothing here talks to the real DigiLocker; the
 * consent card is the caller's job and stays in front of every pull. Link/unlink live in ./link.
 */

export async function GET(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const owner = guard.session.owner;
  const ay = req.nextUrl.searchParams.get("assessmentYear") ?? "2026-27";
  const [profile, status, documents] = await Promise.all([guard.services.locker.profile(owner), guard.services.locker.status(owner), guard.services.locker.documents(owner, ay)]);
  return NextResponse.json({ ok: true, provider: guard.services.locker.name, profile, status, documents, durable: guard.services.dbConfigured });
}

const pullSchema = z.object({
  assessmentYear: z.string().regex(/^\d{4}-\d{2}$/).default("2026-27"),
  scope: z.enum(["year", "identity", "all"]).default("year"),
});

export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    // an empty body means the current year's papers
  }
  const parsed = pullSchema.safeParse(raw ?? {});
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  const owner = guard.session.owner;
  const issued = await guard.services.locker.pull(owner, parsed.data.assessmentYear, parsed.data.scope);
  const documents = [];
  for (const doc of issued) {
    let id: string | null = null;
    if (guard.services.vault) {
      const meta = await guard.services.vault.importIssued({ owner, assessmentYear: parsed.data.assessmentYear, docType: doc.docType, title: doc.title, issuer: doc.issuer, fields: doc.fields, actor: "citizen", uri: doc.uri });
      id = meta.id;
    }
    documents.push({ id, uri: doc.uri, docType: doc.docType, title: doc.title, issuer: doc.issuer, scope: doc.scope, issuedOn: doc.issuedOn, sample: doc.sample, fields: doc.fields });
  }
  return NextResponse.json({ ok: true, documents, storedInVault: !!guard.services.vault });
}
