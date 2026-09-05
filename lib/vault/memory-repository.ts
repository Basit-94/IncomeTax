import type {
  AccessAuditEntry,
  DocumentFilter,
  EncryptedBytes,
  ExtractionRecord,
  StoredDocumentMeta,
  VaultRepository,
} from "./repository";
import type { Owner } from "../server/session";

/**
 * In-memory repository — the test double, and nothing more. It is not wired
 * as a runtime fallback: a document "stored" here would vanish on the next
 * deploy while the UI said it was saved (plan.md §3.1, §4.2).
 */
export class MemoryVaultRepository implements VaultRepository {
  readonly docs = new Map<string, StoredDocumentMeta>();
  readonly bytes = new Map<string, EncryptedBytes>();
  readonly extractions = new Map<string, ExtractionRecord>();
  readonly auditLog: AccessAuditEntry[] = [];

  private owned(owner: Owner, meta: StoredDocumentMeta | undefined): StoredDocumentMeta | null {
    if (!meta || meta.deletedAt) return null;
    return meta.ownerPan === owner.pan && meta.ownerKind === owner.kind ? meta : null;
  }

  async listDocuments(owner: Owner, filter?: DocumentFilter) {
    return [...this.docs.values()]
      .filter((d) => this.owned(owner, d))
      .filter((d) => !filter?.assessmentYear || d.assessmentYear === filter.assessmentYear)
      .filter((d) => !filter?.docType || d.docType === filter.docType)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async getDocument(owner: Owner, id: string) {
    return this.owned(owner, this.docs.get(id));
  }

  async findBySha(owner: Owner, sha256: string) {
    return (
      [...this.docs.values()].find((d) => this.owned(owner, d) && d.sha256 === sha256) ?? null
    );
  }

  async putDocument(meta: StoredDocumentMeta, bytes?: EncryptedBytes) {
    this.docs.set(meta.id, { ...meta });
    if (bytes) this.bytes.set(meta.id, bytes);
  }

  async getBytes(owner: Owner, id: string) {
    return this.owned(owner, this.docs.get(id)) ? (this.bytes.get(id) ?? null) : null;
  }

  async softDelete(owner: Owner, id: string, at: string) {
    const meta = this.owned(owner, this.docs.get(id));
    if (!meta) return false;
    this.docs.set(id, { ...meta, deletedAt: at });
    return true;
  }

  async putExtraction(owner: Owner, record: ExtractionRecord) {
    if (!this.owned(owner, this.docs.get(record.documentId))) return;
    this.extractions.set(record.documentId, record);
  }

  async getExtraction(owner: Owner, documentId: string) {
    return this.owned(owner, this.docs.get(documentId))
      ? (this.extractions.get(documentId) ?? null)
      : null;
  }

  async audit(entry: AccessAuditEntry) {
    this.auditLog.push(entry);
  }
}
