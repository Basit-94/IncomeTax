import { NextResponse, type NextRequest } from "next/server";
import { requireSession, storageUnavailable } from "@/lib/server/context";
import { MAX_ORIGINAL_BYTES } from "@/lib/vault/service";
import type { VaultDocType } from "@/lib/vault/types";

const DOC_TYPES: readonly VaultDocType[] = [
  "FORM_16", "ANNUAL_INFO_STATEMENT", "FORM_26AS", "BANK_STATEMENT", "CHALLAN_280", "ITR_V", "OTHER",
];

/** The owner's documents, newest first. Optional ?year=2026-27&type=FORM_16. */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  if (!guard.services.vault) return storageUnavailable();

  const year = req.nextUrl.searchParams.get("year") ?? undefined;
  const type = req.nextUrl.searchParams.get("type") as VaultDocType | null;
  const docs = await guard.services.vault.list(guard.session.owner, {
    assessmentYear: year,
    docType: type && DOC_TYPES.includes(type) ? type : undefined,
  });
  return NextResponse.json({ ok: true, documents: docs });
}

/**
 * Upload one original (multipart: file, docType, assessmentYear, issuer?, title?).
 * Refusals are named (§4.3: "Unsupported or password-protected files produce a
 * recoverable request, never invented fields").
 */
export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  if (!guard.services.vault) return storageUnavailable();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request", message: "Expected multipart form data." }, { status: 400 });
  }
  const file = form.get("file");
  const docType = String(form.get("docType") ?? "OTHER") as VaultDocType;
  const assessmentYear = String(form.get("assessmentYear") ?? "2026-27");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file_required" }, { status: 400 });
  }
  if (!DOC_TYPES.includes(docType)) {
    return NextResponse.json({ ok: false, error: "unknown_doc_type" }, { status: 400 });
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return NextResponse.json(
      { ok: false, error: "too_large", message: `Files up to ${MAX_ORIGINAL_BYTES / 1024 / 1024} MB are accepted.` },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await guard.services.vault.upload({
    owner: guard.session.owner,
    bytes,
    filename: file.name,
    declaredMime: file.type || undefined,
    assessmentYear,
    docType,
    title: form.get("title") ? String(form.get("title")) : undefined,
    issuer: form.get("issuer") ? String(form.get("issuer")) : undefined,
  });
  if (!result.ok) {
    const status = result.reason === "too_large" ? 413 : result.reason === "storage_key_missing" ? 503 : 415;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }
  return NextResponse.json(result, { status: result.deduplicated ? 200 : 201 });
}
