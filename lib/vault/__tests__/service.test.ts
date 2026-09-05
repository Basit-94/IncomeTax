import { describe, expect, it } from "vitest";
import { MemoryVaultRepository } from "../memory-repository";
import { MAX_ORIGINAL_BYTES, VaultService, sniffMime } from "../service";
import { loadVaultKey, type VaultKey } from "../crypto";
import type { Owner } from "../../server/session";

const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
const rakesh: Owner = { pan: "DEMPK8823R", kind: "demo", displayName: "Rakesh Kumar" };
const KEY = loadVaultKey({ WAPSI_VAULT_KEY: Buffer.alloc(32, 7).toString("base64") })!;

/** A tiny but valid-looking uncompressed PDF carrying the fields the parser reads. */
function pdf(text: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.4\n1 0 obj << >> endobj\nstream\n${text}\nendstream\n%%EOF`);
}
const FORM16 = pdf("FORM NO. 16 Certificate under section 203 Name of the Employee: SUNITA DEVI PAN of the Employee: DEMPS4417K Gross Salary: 4,20,000 Total Tax Deducted: 8,400");

function service(repo = new MemoryVaultRepository(), key: VaultKey | null = KEY) {
  return { repo, svc: new VaultService(repo, key, () => new Date("2026-09-05T12:00:00Z")) };
}

describe("VaultService — Phase B acceptance (plan §7)", () => {
  it("upload once, reopen identical bytes, and read the extracted fields through the owner-scoped service", async () => {
    const { svc } = service();
    const up = await svc.upload({ owner: sunita, bytes: FORM16, filename: "form16.pdf", declaredMime: "application/pdf", assessmentYear: "2026-27", docType: "FORM_16", issuer: "Infosys Ltd" });
    expect(up.ok).toBe(true);
    if (!up.ok) return;
    expect(up.deduplicated).toBe(false);
    expect(up.document.provenance).toBe("uploaded");
    expect(up.document.hasBytes).toBe(true);
    expect(up.document.mimeType).toBe("application/pdf");
    expect(up.document.byteLength).toBe(FORM16.length);

    const opened = await svc.open(sunita, up.document.id);
    expect(opened).not.toBeNull();
    expect(Buffer.from(opened!.bytes).equals(Buffer.from(FORM16))).toBe(true);

    expect(up.extraction?.status).toBe("ok");
    expect(up.extraction?.fields.grossSalary).toBe(420000);
    expect(up.extraction?.fields.tds).toBe(8400);
    expect(up.extraction?.fields.pan).toBe("DEMPS4417K");
    expect(up.extraction?.reviewState).toBe("unreviewed");
  });

  it("stores ciphertext, not the file (§4.2)", async () => {
    const { repo, svc } = service();
    const up = await svc.upload({ owner: sunita, bytes: FORM16, filename: "f.pdf", assessmentYear: "2026-27", docType: "FORM_16" });
    if (!up.ok) throw new Error("upload failed");
    const blob = repo.bytes.get(up.document.id)!;
    expect(Buffer.from(blob.ciphertext).includes(Buffer.from("SUNITA DEVI"))).toBe(false);
    expect(blob.keyId).toBe(KEY.id);
  });

  it("deduplicates identical content per owner; a matching title is not enough", async () => {
    const { svc } = service();
    const a = await svc.upload({ owner: sunita, bytes: FORM16, filename: "a.pdf", assessmentYear: "2026-27", docType: "FORM_16", title: "Form 16" });
    const b = await svc.upload({ owner: sunita, bytes: FORM16, filename: "b.pdf", assessmentYear: "2026-27", docType: "FORM_16", title: "Form 16" });
    const c = await svc.upload({ owner: sunita, bytes: pdf("FORM NO. 16 different content Gross Salary: 1 TDS: 1"), filename: "c.pdf", assessmentYear: "2026-27", docType: "FORM_16", title: "Form 16" });
    if (!a.ok || !b.ok || !c.ok) throw new Error("upload failed");
    expect(b.deduplicated).toBe(true);
    expect(b.document.id).toBe(a.document.id);
    expect(c.deduplicated).toBe(false);
    expect(c.document.id).not.toBe(a.document.id);
    expect((await svc.list(sunita)).length).toBe(2);
  });

  it("a different owner cannot list, read, extract or delete it — a foreign id looks missing", async () => {
    const { svc } = service();
    const up = await svc.upload({ owner: sunita, bytes: FORM16, filename: "f.pdf", assessmentYear: "2026-27", docType: "FORM_16" });
    if (!up.ok) throw new Error("upload failed");
    expect(await svc.list(rakesh)).toEqual([]);
    expect(await svc.getMeta(rakesh, up.document.id)).toBeNull();
    expect(await svc.open(rakesh, up.document.id)).toBeNull();
    expect(await svc.getExtraction(rakesh, up.document.id)).toBeNull();
    expect(await svc.remove(rakesh, up.document.id)).toBe(false);
    // Same PAN, different owner kind is a different owner too (demo rows are isolated).
    expect(await svc.getMeta({ ...sunita, kind: "citizen" }, up.document.id)).toBeNull();
  });

  it("refuses: empty, over 5 MB, unsupported type, declared type that disagrees with the bytes", async () => {
    const { svc } = service();
    const base = { owner: sunita, filename: "x", assessmentYear: "2026-27", docType: "OTHER" as const };
    expect(await svc.upload({ ...base, bytes: new Uint8Array(0) })).toEqual({ ok: false, reason: "empty" });
    expect(await svc.upload({ ...base, bytes: new Uint8Array(MAX_ORIGINAL_BYTES + 1) })).toEqual({ ok: false, reason: "too_large" });
    expect(await svc.upload({ ...base, bytes: new TextEncoder().encode("hello world") })).toEqual({ ok: false, reason: "unsupported_type" });
    expect(await svc.upload({ ...base, bytes: FORM16, declaredMime: "image/png" })).toEqual({ ok: false, reason: "type_mismatch" });
  });

  it("without a storage key nothing is stored, and the refusal says why", async () => {
    const { repo, svc } = service(new MemoryVaultRepository(), null);
    expect(await svc.upload({ owner: sunita, bytes: FORM16, filename: "f.pdf", assessmentYear: "2026-27", docType: "FORM_16" })).toEqual({ ok: false, reason: "storage_key_missing" });
    expect(repo.docs.size).toBe(0);
    expect(repo.auditLog.at(-1)).toMatchObject({ operation: "upload", result: "refused" });
  });

  it("an image is stored but its extraction is 'unsupported' with a manual-entry issue (§4.3)", async () => {
    const { svc } = service();
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    const up = await svc.upload({ owner: sunita, bytes: png, filename: "scan.png", assessmentYear: "2026-27", docType: "FORM_16" });
    if (!up.ok) throw new Error("upload failed");
    expect(up.extraction?.status).toBe("unsupported");
    expect(up.extraction?.fields).toEqual({});
    expect(up.extraction?.issues[0]).toMatch(/entered by hand/);
  });

  it("a PDF naming another PAN is stored with an issue: the document's subject is not its owner (§3.2)", async () => {
    const { svc } = service();
    const other = pdf("FORM NO. 16 PAN of the Employee: ABCDE1234F Gross Salary: 5,00,000 Total Tax Deducted: 10,000");
    const up = await svc.upload({ owner: sunita, bytes: other, filename: "f.pdf", assessmentYear: "2026-27", docType: "FORM_16" });
    if (!up.ok) throw new Error("upload failed");
    expect(up.extraction?.issues.some((i) => /names PAN ABC/.test(i))).toBe(true);
  });

  it("a metadata-only record has no bytes to open and says so", async () => {
    const { repo, svc } = service();
    await repo.putDocument({
      id: "doc_f16", ownerPan: sunita.pan, ownerKind: "demo", assessmentYear: "2026-27", docType: "FORM_16",
      title: "Form 16", byteLength: 0, provenance: "metadata_only", version: 1, uploadedAt: "2026-06-15T00:00:00Z", hasBytes: false,
    });
    expect((await svc.getMeta(sunita, "doc_f16"))?.hasBytes).toBe(false);
    expect(await svc.open(sunita, "doc_f16")).toBeNull();
    expect(await svc.reextract(sunita, "doc_f16")).toBeNull();
  });

  it("soft delete hides the record from every read but keeps the row", async () => {
    const { repo, svc } = service();
    const up = await svc.upload({ owner: sunita, bytes: FORM16, filename: "f.pdf", assessmentYear: "2026-27", docType: "FORM_16" });
    if (!up.ok) throw new Error("upload failed");
    expect(await svc.remove(sunita, up.document.id)).toBe(true);
    expect(await svc.getMeta(sunita, up.document.id)).toBeNull();
    expect(repo.docs.get(up.document.id)?.deletedAt).toBeDefined();
  });

  it("every operation is audited without document text", async () => {
    const { repo, svc } = service();
    const up = await svc.upload({ owner: sunita, bytes: FORM16, filename: "f.pdf", assessmentYear: "2026-27", docType: "FORM_16", actor: "agent", runId: "run_1" });
    if (!up.ok) throw new Error("upload failed");
    await svc.list(sunita, undefined, "agent", "run_1");
    await svc.open(rakesh, up.document.id, "agent", "run_2");
    const ops = repo.auditLog.map((e) => `${e.actor}:${e.operation}:${e.result}`);
    expect(ops).toEqual(["agent:upload:ok", "agent:extract:ok", "agent:list:ok", "agent:read_bytes:not_found"]);
    expect(JSON.stringify(repo.auditLog)).not.toContain("SUNITA");
  });
});

describe("sniffMime", () => {
  it("trusts bytes, not names", () => {
    expect(sniffMime(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffMime(new TextEncoder().encode("<html>"))).toBeNull();
  });
});
