import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "../../server/db";
import { createUser } from "../../server/auth";
import { forgetDataKeys, listAudit, putDocument, putSlot, readSlotValues, resetVaultForTests, slotStatuses } from "../../server/vault";
import { forget, forgetAll, memoryValueProblem, recall, remember } from "../memory";
import { activeRun, appendEvent, createRun, deleteRun, getOutput, listRuns, loadEvents, putOutput, updateRun } from "../runs";
import { callTool, ToolArgumentError } from "../tools";

describe("vault", () => {
  beforeEach(() => {
    resetDbForTests();
    resetVaultForTests();
    forgetDataKeys();
  });

  it("encrypts a value, returns only the mask, and audits every read", () => {
    const user = createUser("sunita", "secret1");
    const status = putSlot(user.id, "aadhaar", "234567890123", { masked: "XXXX XXXX 0123", source: "user" });
    expect(status.masked).toBe("XXXX XXXX 0123");
    const statuses = slotStatuses(user.id);
    expect(statuses.aadhaar.masked).toBe("XXXX XXXX 0123");
    expect(JSON.stringify(statuses)).not.toContain("234567890123");
    const values = readSlotValues(user.id, ["aadhaar", "missing"], { actor: "agent", runId: "r1", reason: "file_return" });
    expect(values).toEqual({ aadhaar: "234567890123" });
    const audit = listAudit(user.id);
    expect(audit.map((row) => row.action)).toEqual(["slot.read", "slot.write"]);
    expect(audit[0].runId).toBe("r1");
    // Another user cannot read it, even with the id.
    const other = createUser("rakesh", "secret1");
    expect(readSlotValues(other.id, ["aadhaar"], { actor: "agent" })).toEqual({});
  });

  it("survives a cache flush (the wrapped key round-trips through the master key)", () => {
    const user = createUser("priya", "secret1");
    putSlot(user.id, "pan", "DEMPS9052M", { masked: "DEXXXXXX2M", source: "digilocker", verified: true });
    forgetDataKeys();
    expect(readSlotValues(user.id, ["pan"], { actor: "user" })).toEqual({ pan: "DEMPS9052M" });
    expect(slotStatuses(user.id).pan.verified).toBe(true);
  });

  it("stores documents once by hash and refuses the wrong shape", () => {
    const user = createUser("sunita", "secret1");
    const bytes = Buffer.from("%PDF-1.4 synthetic");
    const first = putDocument(user.id, { docType: "form16", assessmentYear: "2026-27", filename: "a.pdf", contentType: "application/pdf", bytes, source: "upload" });
    const again = putDocument(user.id, { docType: "form16", assessmentYear: "2026-27", filename: "b.pdf", contentType: "application/pdf", bytes, source: "upload" });
    expect(again.id).toBe(first.id);
    expect(() => putDocument(user.id, { docType: "x", assessmentYear: "2026-27", filename: "a.txt", contentType: "text/plain", bytes, source: "upload" })).toThrow("type");
    expect(() => putDocument(user.id, { docType: "x", assessmentYear: "2026-27", filename: "a.pdf", contentType: "application/pdf", bytes: Buffer.alloc(0), source: "upload" })).toThrow("empty");
  });
});

describe("memory", () => {
  beforeEach(() => {
    resetDbForTests();
    resetVaultForTests();
    forgetDataKeys();
  });

  it("remembers facts, upserts by key, and refuses identifiers and amounts", () => {
    const user = createUser("sunita", "secret1");
    remember(user.id, "employment", "salaried", "r1");
    remember(user.id, "employment", "freelance", "r2");
    expect(recall(user.id)).toMatchObject([{ key: "employment", value: "freelance" }]);
    expect(listAudit(user.id).some((row) => row.action === "memory.replaced")).toBe(true);
    expect(() => remember(user.id, "pan", "DEMPS4417K")).toThrow(/PAN/);
    expect(() => remember(user.id, "phone", "98765 43210")).toThrow(/number/);
    expect(() => remember(user.id, "salary", "₹14,00,000")).toThrow(/amount/);
    expect(() => remember(user.id, "salary", "14 lakh")).toThrow(/amount/);
    expect(() => remember(user.id, "Bad Key", "x")).toThrow(/key/);
    expect(memoryValueProblem("has a PF account")).toBeNull();
    expect(forget(user.id, "employment")).toBe(true);
    expect(forget(user.id, "employment")).toBe(false);
    remember(user.id, "aa", "1");
    remember(user.id, "bb", "2");
    expect(forgetAll(user.id)).toBe(2);
  });
});

describe("runs", () => {
  beforeEach(() => resetDbForTests());

  it("persists events in order, lists newest first, and cascades on delete", () => {
    const user = createUser("sunita", "secret1");
    const run = createRun(user.id, "I got a job");
    expect(activeRun(user.id)?.id).toBe(run.id);
    appendEvent(run.id, { type: "run.start", runId: run.id, title: "I got a job", at: "2026-09-03T00:00:00.000Z" });
    appendEvent(run.id, { type: "message", role: "user", text: "I got a job", at: "2026-09-03T00:00:01.000Z" });
    updateRun(user.id, run.id, { taskId: "file_return", status: "waiting", state: { taskId: "file_return", answers: {}, pendingAskId: "q1", pendingSlotId: "employment_type", phase: "intake", notes: [] } });
    expect(loadEvents(run.id).map((e) => e.type)).toEqual(["run.start", "message"]);
    expect(loadEvents(run.id, 1)).toHaveLength(1);
    const output = putOutput(user.id, run.id, { kind: "itr-v", name: "ITR-V.html", contentType: "text/html", bytes: Buffer.from("<html>") });
    expect(getOutput(user.id, output.id)?.bytes.toString()).toBe("<html>");
    const later = createRun(user.id, "second");
    expect(listRuns(user.id).map((r) => r.id)).toEqual([later.id, run.id]);
    expect(deleteRun(user.id, run.id)).toBe(true);
    expect(loadEvents(run.id)).toEqual([]);
    expect(getOutput(user.id, output.id)).toBeNull();
  });
});

describe("tools", () => {
  it("validates arguments and computes through the engine only", async () => {
    const ctx = { userId: "u", runId: "r" };
    const compare = await callTool("compare_regimes", { salary: 1_400_000, tds: 110_000, pf: 60_000 }, ctx);
    expect(compare.summary).toMatch(/new ₹.* · old ₹.*regime cheaper/);
    const tax = await callTool("compute_tax", { salary: 1_275_000, tds: 30_000, regime: "new" }, ctx);
    // Mandatory vector from docs/CONTEXT.md §6: ₹12,75,000 salary + ₹30,000 TDS → refund ₹30,000.
    expect((tax.data.breakdown as { refundOrDue: number }).refundOrDue).toBe(30_000);
    await expect(callTool("compute_tax", { salary: -1, regime: "new" }, ctx)).rejects.toBeInstanceOf(ToolArgumentError);
    await expect(callTool("compute_tax", { salary: 1, regime: "sideways" }, ctx)).rejects.toBeInstanceOf(ToolArgumentError);
    const presumptive = await callTool("presumptive_income", { kind: "profession", revenue: 4_000_000, digital: true }, ctx);
    expect(presumptive.data).toMatchObject({ section: "44ADA", eligible: true, deemed: 2_000_000 });
    const tooBig = await callTool("presumptive_income", { kind: "business", revenue: 50_000_000, digital: false }, ctx);
    expect(tooBig.data).toMatchObject({ eligible: false });
    const demo = await callTool("load_demo_persona", { persona: "sunita" }, ctx);
    expect(demo.summary).toContain("Sunita");
    const draft = await callTool("draft_notice_response", { kind: "143_1", amount: 12_000, position: "disagree", reason: "The interest was already declared." }, ctx);
    expect(String(draft.data.text)).toContain("respectfully disagree");
  });
});
