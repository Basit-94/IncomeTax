import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES, listDocuments, putDocument, putSlot } from "@/lib/server/vault";
import { extractFieldsFromPdfBytes, isEmptyExtraction } from "@/lib/compliance/pdfExtract";
import { formatRupees } from "@/lib/harness/interview";

/** Uploads (plan §4.2): 5 MB, PDF/PNG/JPEG, hashed for dedupe, figures extracted server-side. */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const docType = request.nextUrl.searchParams.get("type") ?? undefined;
  return NextResponse.json({ documents: listDocuments(user.id, docType) });
}

export async function POST(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  const file = form.get("file");
  const docType = String(form.get("docType") ?? "other");
  const slotId = form.get("slotId") ? String(form.get("slotId")) : null;
  if (!(file instanceof File)) return NextResponse.json({ error: "missing_file" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "empty", message: "The file is empty." }, { status: 400 });
  if (file.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: "too_large", message: "Files can be at most 5 MB." }, { status: 413 });
  if (!DOCUMENT_TYPES.has(file.type)) return NextResponse.json({ error: "type", message: "Only PDF, PNG and JPEG files are accepted." }, { status: 415 });
  const bytes = Buffer.from(await file.arrayBuffer());
  let extracted: Record<string, unknown> | null = null;
  if (file.type === "application/pdf") {
    const fields = extractFieldsFromPdfBytes(bytes);
    extracted = isEmptyExtraction(fields) ? null : { ...fields };
  }
  const meta = putDocument(user.id, { docType, assessmentYear: "2026-27", filename: file.name.slice(0, 120), contentType: file.type, bytes, source: "upload", extracted });
  if (slotId) putSlot(user.id, slotId, meta.id, { masked: meta.filename, source: "document", actor: "user" });
  const summary = extracted
    ? [extracted.grossSalary ? `salary ${formatRupees(Number(extracted.grossSalary))}` : null, extracted.tds ? `TDS ${formatRupees(Number(extracted.tds))}` : null, extracted.pan ? "PAN" : null].filter(Boolean).join(", ")
    : null;
  return NextResponse.json({ document: meta, extractedSummary: summary }, { status: 201 });
}
