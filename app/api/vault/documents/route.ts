import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES, listDocuments, putDocument, putSlot } from "@/lib/server/vault";
import { extractFieldsFromPdfBytes, isEmptyExtraction } from "@/lib/compliance/pdfExtract";
import { formatRupees } from "@/lib/harness/interview";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

/** Uploads (plan §4.2): 5 MB, PDF/PNG/JPEG, hashed for dedupe, figures extracted server-side. */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const docType = request.nextUrl.searchParams.get("type") ?? undefined;
  return NextResponse.json({ documents: listDocuments(user.id, docType) });
}

function isValidSignature(bytes: Buffer, contentType: string): boolean {
  if (bytes.length < 4) return false;
  if (contentType === "application/pdf") {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  }
  if (contentType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return false;
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "document";
  return base.replace(/[/\\?%*:|"<>]/g, "-").replace(/[\x00-\x1f\x80-\x9f]/g, "").slice(0, 120) || "document";
}

export async function POST(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const ip = getClientIp(request);
  const rate = checkRateLimit(`upload:${user.id}:${ip}`, 10, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Upload limit reached. Please wait a minute before uploading more files." },
      { status: 429, headers: { "Retry-After": String(rate.resetSeconds) } },
    );
  }

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
  if (!isValidSignature(bytes, file.type)) {
    return NextResponse.json({ error: "corrupt_or_mismatched", message: "File contents do not match the expected file type format." }, { status: 400 });
  }
  let extracted: Record<string, unknown> | null = null;
  if (file.type === "application/pdf") {
    const fields = extractFieldsFromPdfBytes(bytes);
    extracted = isEmptyExtraction(fields) ? null : { ...fields };
  }
  const safeName = sanitizeFilename(file.name);
  try {
    const meta = putDocument(user.id, { docType, assessmentYear: "2026-27", filename: safeName, contentType: file.type, bytes, source: "upload", extracted });
    if (slotId) putSlot(user.id, slotId, meta.id, { masked: meta.filename, source: "document", actor: "user" });
    const summary = extracted
      ? [extracted.grossSalary ? `salary ${formatRupees(Number(extracted.grossSalary))}` : null, extracted.tds ? `TDS ${formatRupees(Number(extracted.tds))}` : null, extracted.pan ? "PAN" : null].filter(Boolean).join(", ")
      : null;
    return NextResponse.json({ document: meta, extractedSummary: summary }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "storage_limit_reached") {
      return NextResponse.json({ error: "quota_exceeded", message: "Storage limit reached (maximum 50 documents). Please delete existing documents before uploading more." }, { status: 400 });
    }
    return NextResponse.json({ error: "upload_failed", message: "Failed to store document." }, { status: 500 });
  }
}
