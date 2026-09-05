import type { Pool } from "pg";
import type { Owner } from "../server/session";
import type {
  AccessAuditEntry,
  DocumentFilter,
  DocumentProvenance,
  EncryptedBytes,
  ExtractionRecord,
  ReviewState,
  StoredDocumentMeta,
  VaultDocType,
  VaultRepository,
} from "./repository";

interface DocRow {
  id: string;
  owner_pan: string;
  owner_kind: Owner["kind"];
  assessment_year: string;
  doc_type: VaultDocType;
  title: string;
  filename: string | null;
  mime_type: string | null;
  byte_length: number;
  sha256: string | null;
  issuer: string | null;
  provenance: DocumentProvenance;
  version: number;
  supersedes: string | null;
  uploaded_at: Date;
  deleted_at: Date | null;
  has_bytes: boolean;
}

function toMeta(r: DocRow): StoredDocumentMeta {
  return {
    id: r.id,
    ownerPan: r.owner_pan,
    ownerKind: r.owner_kind,
    assessmentYear: r.assessment_year,
    docType: r.doc_type,
    title: r.title,
    filename: r.filename ?? undefined,
    mimeType: r.mime_type ?? undefined,
    byteLength: r.byte_length,
    sha256: r.sha256 ?? undefined,
    issuer: r.issuer ?? undefined,
    provenance: r.provenance,
    version: r.version,
    supersedes: r.supersedes ?? undefined,
    uploadedAt: new Date(r.uploaded_at).toISOString(),
    deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : undefined,
    hasBytes: r.has_bytes,
  };
}

const SELECT = `
  SELECT d.*, (b.document_id IS NOT NULL) AS has_bytes
  FROM vault_documents d
  LEFT JOIN vault_document_bytes b ON b.document_id = d.id
`;

/** The authoritative store (plan §3.1). Every query carries owner_pan AND owner_kind. */
export class PostgresVaultRepository implements VaultRepository {
  constructor(private readonly pool: Pool) {}

  async listDocuments(owner: Owner, filter?: DocumentFilter) {
    const params: unknown[] = [owner.pan, owner.kind];
    let where = "WHERE d.owner_pan = $1 AND d.owner_kind = $2 AND d.deleted_at IS NULL";
    if (filter?.assessmentYear) { params.push(filter.assessmentYear); where += ` AND d.assessment_year = $${params.length}`; }
    if (filter?.docType) { params.push(filter.docType); where += ` AND d.doc_type = $${params.length}`; }
    const res = await this.pool.query<DocRow>(`${SELECT} ${where} ORDER BY d.uploaded_at DESC`, params);
    return res.rows.map(toMeta);
  }

  async getDocument(owner: Owner, id: string) {
    const res = await this.pool.query<DocRow>(
      `${SELECT} WHERE d.id = $1 AND d.owner_pan = $2 AND d.owner_kind = $3 AND d.deleted_at IS NULL`,
      [id, owner.pan, owner.kind],
    );
    return res.rows[0] ? toMeta(res.rows[0]) : null;
  }

  async findBySha(owner: Owner, sha256: string) {
    const res = await this.pool.query<DocRow>(
      `${SELECT} WHERE d.sha256 = $1 AND d.owner_pan = $2 AND d.owner_kind = $3 AND d.deleted_at IS NULL LIMIT 1`,
      [sha256, owner.pan, owner.kind],
    );
    return res.rows[0] ? toMeta(res.rows[0]) : null;
  }

  async putDocument(meta: StoredDocumentMeta, bytes?: EncryptedBytes) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO vault_documents
           (id, owner_pan, owner_kind, assessment_year, doc_type, title, filename, mime_type, byte_length,
            sha256, issuer, provenance, version, supersedes, uploaded_at, deleted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, issuer = EXCLUDED.issuer, provenance = EXCLUDED.provenance,
           version = EXCLUDED.version, supersedes = EXCLUDED.supersedes, deleted_at = EXCLUDED.deleted_at`,
        [
          meta.id, meta.ownerPan, meta.ownerKind, meta.assessmentYear, meta.docType, meta.title,
          meta.filename ?? null, meta.mimeType ?? null, meta.byteLength, meta.sha256 ?? null,
          meta.issuer ?? null, meta.provenance, meta.version, meta.supersedes ?? null,
          meta.uploadedAt, meta.deletedAt ?? null,
        ],
      );
      if (bytes) {
        await client.query(
          `INSERT INTO vault_document_bytes (document_id, iv, auth_tag, ciphertext, key_id)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (document_id) DO NOTHING`,
          [meta.id, Buffer.from(bytes.iv), Buffer.from(bytes.authTag), Buffer.from(bytes.ciphertext), bytes.keyId],
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getBytes(owner: Owner, id: string) {
    const res = await this.pool.query<{ iv: Buffer; auth_tag: Buffer; ciphertext: Buffer; key_id: string }>(
      `SELECT b.iv, b.auth_tag, b.ciphertext, b.key_id
       FROM vault_document_bytes b JOIN vault_documents d ON d.id = b.document_id
       WHERE d.id = $1 AND d.owner_pan = $2 AND d.owner_kind = $3 AND d.deleted_at IS NULL`,
      [id, owner.pan, owner.kind],
    );
    const r = res.rows[0];
    return r ? { iv: r.iv, authTag: r.auth_tag, ciphertext: r.ciphertext, keyId: r.key_id } : null;
  }

  async softDelete(owner: Owner, id: string, at: string) {
    const res = await this.pool.query(
      `UPDATE vault_documents SET deleted_at = $4
       WHERE id = $1 AND owner_pan = $2 AND owner_kind = $3 AND deleted_at IS NULL`,
      [id, owner.pan, owner.kind, at],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async putExtraction(owner: Owner, record: ExtractionRecord) {
    // The join enforces ownership: an extraction cannot be attached to a foreign document.
    await this.pool.query(
      `INSERT INTO vault_extractions (document_id, sha256, parser_version, status, fields, issues, review_state, extracted_at)
       SELECT d.id, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8
       FROM vault_documents d WHERE d.id = $1 AND d.owner_pan = $9 AND d.owner_kind = $10
       ON CONFLICT (document_id) DO UPDATE SET
         sha256 = EXCLUDED.sha256, parser_version = EXCLUDED.parser_version, status = EXCLUDED.status,
         fields = EXCLUDED.fields, issues = EXCLUDED.issues, review_state = EXCLUDED.review_state,
         extracted_at = EXCLUDED.extracted_at`,
      [
        record.documentId, record.sha256 ?? null, record.parserVersion, record.status,
        JSON.stringify(record.fields), JSON.stringify(record.issues), record.reviewState,
        record.extractedAt, owner.pan, owner.kind,
      ],
    );
  }

  async getExtraction(owner: Owner, documentId: string) {
    const res = await this.pool.query<{
      document_id: string; sha256: string | null; parser_version: string; status: ExtractionRecord["status"];
      fields: ExtractionRecord["fields"]; issues: string[]; review_state: ReviewState; extracted_at: Date;
    }>(
      `SELECT e.* FROM vault_extractions e JOIN vault_documents d ON d.id = e.document_id
       WHERE e.document_id = $1 AND d.owner_pan = $2 AND d.owner_kind = $3`,
      [documentId, owner.pan, owner.kind],
    );
    const r = res.rows[0];
    return r
      ? {
          documentId: r.document_id,
          sha256: r.sha256 ?? undefined,
          parserVersion: r.parser_version,
          status: r.status,
          fields: r.fields,
          issues: r.issues,
          reviewState: r.review_state,
          extractedAt: new Date(r.extracted_at).toISOString(),
        }
      : null;
  }

  async audit(entry: AccessAuditEntry) {
    await this.pool.query(
      `INSERT INTO vault_access_audit (owner_pan, actor, run_id, tool, document_id, operation, result, at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [entry.ownerPan, entry.actor, entry.runId ?? null, entry.tool ?? null, entry.documentId ?? null, entry.operation, entry.result, entry.at],
    );
  }
}
