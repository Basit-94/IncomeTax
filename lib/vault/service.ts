/**
 * The document service (plan.md §3.1, §4.3). Owner-scoped operations over a
 * VaultRepository with the validation the plan lists: owner, year, type,
 * size, signature/MIME, duplicate detection by content hash, bounded
 * extraction, and an access audit on every operation.
 *
 * Extracted values are proposals (§4.3). The service stores what the parser
 * found and what it did not; it never fills a missing field.
 */

import { extractFieldsFromPdf, isEmptyExtraction } from "../compliance/pdfExtract";
import { PDF_PARSER_VERSION } from "../agentic/flags";
import type { Owner } from "../server/session";
import { decryptBytes, encryptBytes, sha256Hex, type VaultKey } from "./crypto";
import type {
  AccessAuditEntry,
  DocumentFilter,
  ExtractionRecord,
  StoredDocumentMeta,
  VaultDocType,
  VaultRepository,
} from "./repository";

/** 5 MB, matching the Java store's StoredDocument.MAX_BYTES (§4.3). */
export const MAX_ORIGINAL_BYTES = 5 * 1024 * 1024;
/** Extraction is cut off here rather than left to run on a hostile file. */
export const EXTRACTION_TIMEOUT_MS = 5000;

const ALLOWED_MIME = new Set(["application/pdf", "image/png", "image/jpeg"]);

/** What the bytes say they are. The declared MIME type is only checked against this. */
export function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 5 && String.fromCharCode(...bytes.subarray(0, 5)) === "%PDF-") return "application/pdf";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

export type UploadRefusal =
  | "too_large"
  | "empty"
  | "unsupported_type"
  | "type_mismatch"
  | "storage_key_missing"
  | "storage_unavailable";

export type UploadResult =
  | { ok: true; document: StoredDocumentMeta; extraction: ExtractionRecord | null; deduplicated: boolean }
  | { ok: false; reason: UploadRefusal };

export interface UploadInput {
  owner: Owner;
  bytes: Uint8Array;
  filename: string;
  declaredMime?: string;
  assessmentYear: string;
  docType: VaultDocType;
  title?: string;
  issuer?: string;
  actor?: AccessAuditEntry["actor"];
  runId?: string;
}

export class VaultService {
  constructor(
    private readonly repo: VaultRepository,
    private readonly key: VaultKey | null,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private now() {
    return this.clock().toISOString();
  }

  private async audit(entry: Omit<AccessAuditEntry, "at">) {
    await this.repo.audit({ ...entry, at: this.now() });
  }

  async list(owner: Owner, filter?: DocumentFilter, actor: AccessAuditEntry["actor"] = "citizen", runId?: string) {
    const docs = await this.repo.listDocuments(owner, filter);
    await this.audit({ ownerPan: owner.pan, actor, runId, operation: "list", result: "ok" });
    return docs;
  }

  async getMeta(owner: Owner, id: string, actor: AccessAuditEntry["actor"] = "citizen", runId?: string) {
    const doc = await this.repo.getDocument(owner, id);
    await this.audit({ ownerPan: owner.pan, actor, runId, documentId: id, operation: "read_meta", result: doc ? "ok" : "not_found" });
    return doc;
  }

  /**
   * Store an original once. Same content for the same owner returns the
   * existing record (§4.1: "Deduplicate uploads by content hash per owner;
   * matching titles are not proof of identical contents").
   */
  async upload(input: UploadInput): Promise<UploadResult> {
    const { owner, bytes } = input;
    const actor = input.actor ?? "citizen";
    const refuse = async (reason: UploadRefusal): Promise<UploadResult> => {
      await this.audit({ ownerPan: owner.pan, actor, runId: input.runId, operation: "upload", result: "refused" });
      return { ok: false, reason };
    };

    if (bytes.length === 0) return refuse("empty");
    if (bytes.length > MAX_ORIGINAL_BYTES) return refuse("too_large");
    const sniffed = sniffMime(bytes);
    if (!sniffed || !ALLOWED_MIME.has(sniffed)) return refuse("unsupported_type");
    if (input.declaredMime && input.declaredMime !== sniffed) return refuse("type_mismatch");
    if (!this.key) return refuse("storage_key_missing");

    const sha = sha256Hex(bytes);
    const existing = await this.repo.findBySha(owner, sha);
    if (existing) {
      const extraction = await this.repo.getExtraction(owner, existing.id);
      await this.audit({ ownerPan: owner.pan, actor, runId: input.runId, documentId: existing.id, operation: "upload", result: "ok" });
      return { ok: true, document: existing, extraction, deduplicated: true };
    }

    const meta: StoredDocumentMeta = {
      id: `doc_${sha.slice(0, 12)}_${Date.now().toString(36)}`,
      ownerPan: owner.pan,
      ownerKind: owner.kind,
      assessmentYear: input.assessmentYear,
      docType: input.docType,
      title: input.title?.trim() || defaultTitle(input.docType, input.filename),
      filename: input.filename,
      mimeType: sniffed,
      byteLength: bytes.length,
      sha256: sha,
      issuer: input.issuer,
      provenance: "uploaded",
      version: 1,
      uploadedAt: this.now(),
      hasBytes: true,
    };
    await this.repo.putDocument(meta, encryptBytes(bytes, this.key));
    await this.audit({ ownerPan: owner.pan, actor, runId: input.runId, documentId: meta.id, operation: "upload", result: "ok" });

    const extraction = await this.extract(owner, meta, bytes, actor, input.runId);
    return { ok: true, document: meta, extraction, deduplicated: false };
  }

  /** The original, decrypted for the owner. Null for anything not theirs or without bytes. */
  async open(owner: Owner, id: string, actor: AccessAuditEntry["actor"] = "citizen", runId?: string): Promise<{ meta: StoredDocumentMeta; bytes: Uint8Array } | null> {
    const meta = await this.repo.getDocument(owner, id);
    if (!meta || !meta.hasBytes || !this.key) {
      await this.audit({ ownerPan: owner.pan, actor, runId, documentId: id, operation: "read_bytes", result: meta ? "refused" : "not_found" });
      return null;
    }
    const blob = await this.repo.getBytes(owner, id);
    if (!blob) {
      await this.audit({ ownerPan: owner.pan, actor, runId, documentId: id, operation: "read_bytes", result: "not_found" });
      return null;
    }
    const bytes = decryptBytes(blob, this.key);
    await this.audit({ ownerPan: owner.pan, actor, runId, documentId: id, operation: "read_bytes", result: "ok" });
    return { meta, bytes };
  }

  async remove(owner: Owner, id: string, actor: AccessAuditEntry["actor"] = "citizen") {
    const ok = await this.repo.softDelete(owner, id, this.now());
    await this.audit({ ownerPan: owner.pan, actor, documentId: id, operation: "delete", result: ok ? "ok" : "not_found" });
    return ok;
  }

  async getExtraction(owner: Owner, id: string) {
    return this.repo.getExtraction(owner, id);
  }

  /** Re-run the parser on a stored original (a newer parser, or a first run for a legacy record). */
  async reextract(owner: Owner, id: string, actor: AccessAuditEntry["actor"] = "citizen", runId?: string) {
    const opened = await this.open(owner, id, actor, runId);
    if (!opened) return null;
    return this.extract(owner, opened.meta, opened.bytes, actor, runId);
  }

  /**
   * Bounded extraction (§4.3). PDFs go through the current parser under a
   * timeout; images are stored but yield "unsupported" until OCR exists —
   * "Images and scans can be stored but require manual figures".
   */
  private async extract(owner: Owner, meta: StoredDocumentMeta, bytes: Uint8Array, actor: AccessAuditEntry["actor"], runId?: string): Promise<ExtractionRecord> {
    let record: ExtractionRecord;
    const base = { documentId: meta.id, sha256: meta.sha256, parserVersion: PDF_PARSER_VERSION, reviewState: "unreviewed" as const, extractedAt: this.now() };
    if (meta.mimeType !== "application/pdf") {
      record = { ...base, status: "unsupported", fields: {}, issues: ["Image or scan: figures must be entered by hand until OCR is implemented and verified."] };
    } else {
      try {
        const fields = await withTimeout(extractFieldsFromPdf(bytes), EXTRACTION_TIMEOUT_MS);
        const issues: string[] = [];
        if (fields.pan && fields.pan !== owner.pan) {
          // A PAN in a document identifies its subject, not its owner (§3.2).
          issues.push(`The document names PAN ${fields.pan.slice(0, 3)}…, not the signed-in citizen's.`);
        }
        if (fields.grossSalary === undefined) issues.push("Gross salary was not found.");
        if (fields.tds === undefined) issues.push("Tax deducted at source was not found.");
        record = { ...base, status: isEmptyExtraction(fields) ? "empty" : "ok", fields, issues };
      } catch (err) {
        record = { ...base, status: "error", fields: {}, issues: [err instanceof Error && err.message === "timeout" ? "Reading the file took too long and was stopped." : "The file could not be read."] };
      }
    }
    await this.repo.putExtraction(owner, record);
    await this.audit({ ownerPan: owner.pan, actor, runId, documentId: meta.id, operation: "extract", result: record.status === "error" ? "error" : "ok" });
    return record;
  }
}

function defaultTitle(docType: VaultDocType, filename: string): string {
  const names: Record<VaultDocType, string> = {
    FORM_16: "Form 16",
    ANNUAL_INFO_STATEMENT: "Annual Information Statement (AIS)",
    FORM_26AS: "Tax Credit Statement (Form 26AS)",
    BANK_STATEMENT: "Bank statement",
    CHALLAN_280: "Challan 280 receipt",
    ITR_V: "ITR-V acknowledgement",
    OTHER: filename || "Document",
  };
  return names[docType];
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
