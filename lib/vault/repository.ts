/**
 * The document service's storage contract (plan.md §3.1: "Introduce a
 * server-side VaultRepository behind the existing vault API, with owner-scoped
 * operations"). Every method takes the owner; a repository never answers a
 * question about a document its caller does not own — a foreign id is
 * indistinguishable from a missing one.
 *
 * Two implementations: PostgreSQL (the authoritative store, §3.1) and an
 * in-memory one used by tests. There is deliberately no third "fallback" store:
 * when no database is configured the service says so instead of pretending.
 */

import type { ExtractedFields } from "../compliance/pdfExtract";
import type { Owner } from "../server/session";
import type { DocumentProvenance, VaultDocType } from "./types";

export type { DocumentProvenance, VaultDocType };

export interface StoredDocumentMeta {
  id: string;
  ownerPan: string;
  ownerKind: Owner["kind"];
  assessmentYear: string;
  docType: VaultDocType;
  title: string;
  filename?: string;
  mimeType?: string;
  byteLength: number;
  sha256?: string;
  issuer?: string;
  provenance: DocumentProvenance;
  version: number;
  supersedes?: string;
  uploadedAt: string;
  deletedAt?: string;
  /** True when original bytes are stored. A metadata match is "record found; original unavailable" (§4.3). */
  hasBytes: boolean;
}

export interface EncryptedBytes {
  iv: Uint8Array;
  authTag: Uint8Array;
  ciphertext: Uint8Array;
  keyId: string;
}

export type ExtractionStatus = "ok" | "empty" | "unsupported" | "error";
export type ReviewState = "unreviewed" | "accepted" | "rejected";

export interface ExtractionRecord {
  documentId: string;
  sha256?: string;
  parserVersion: string;
  status: ExtractionStatus;
  fields: ExtractedFields;
  issues: string[];
  reviewState: ReviewState;
  extractedAt: string;
}

export interface AccessAuditEntry {
  ownerPan: string;
  actor: "citizen" | "agent" | "system";
  runId?: string;
  tool?: string;
  documentId?: string;
  operation: "list" | "read_meta" | "read_bytes" | "upload" | "delete" | "extract" | "denied";
  result: "ok" | "not_found" | "refused" | "error";
  at: string;
}

export interface DocumentFilter {
  assessmentYear?: string;
  docType?: VaultDocType;
}

export interface VaultRepository {
  listDocuments(owner: Owner, filter?: DocumentFilter): Promise<StoredDocumentMeta[]>;
  getDocument(owner: Owner, id: string): Promise<StoredDocumentMeta | null>;
  findBySha(owner: Owner, sha256: string): Promise<StoredDocumentMeta | null>;
  putDocument(meta: StoredDocumentMeta, bytes?: EncryptedBytes): Promise<void>;
  getBytes(owner: Owner, id: string): Promise<EncryptedBytes | null>;
  softDelete(owner: Owner, id: string, at: string): Promise<boolean>;
  putExtraction(owner: Owner, record: ExtractionRecord): Promise<void>;
  getExtraction(owner: Owner, documentId: string): Promise<ExtractionRecord | null>;
  audit(entry: AccessAuditEntry): Promise<void>;
}
