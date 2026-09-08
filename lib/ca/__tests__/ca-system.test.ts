import { describe, it, expect, beforeEach } from "vitest";
import { MemoryCAStore, issueCaSession, resolveCa, revokeCaSession, CA_SESSION_COOKIE, type CAAccount } from "../server-store";
import { registerAccount, loginAccount, createReview, claimReview, submitReview, decideReview, addComment, publicReview } from "../server-actions";
import { compareReturns } from "../compare";
import { PERSONAS } from "../../personas";
import type { Owner } from "../../server/session";

const sunita = PERSONAS.sunita;
const owner: Owner = { pan: sunita.pan, kind: "demo", displayName: sunita.name };

async function ca(store: MemoryCAStore, membershipNo: string, name = "Rajesh Sharma"): Promise<CAAccount> {
  const r = await registerAccount(store, { name, membershipNo, password: "secret1", city: "Delhi" });
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

describe("CA system (2026-09-08): accounts, broadcast requests, claims, comments, decisions", () => {
  let store: MemoryCAStore;
  beforeEach(() => { store = new MemoryCAStore(true); });

  it("registers a Wapsi certified CA once and signs them in by number or email", async () => {
    const a = await ca(store, "084920");
    expect(a.name).toBe("CA Rajesh Sharma");
    expect(a.certified).toBe(true);
    expect((await registerAccount(store, { name: "X", membershipNo: "084920", password: "abcd" })).ok).toBe(false);
    expect((await loginAccount(store, "084920", "wrong")).ok).toBe(false);
    const byEmail = await loginAccount(store, a.email, "secret1");
    expect(byEmail.ok && byEmail.value.id).toBe(a.id);
    const session = await issueCaSession(store, a.id);
    const cookie = `${CA_SESSION_COOKIE}=${session.id}; other=1`;
    expect((await resolveCa(store, cookie))?.id).toBe(a.id);
    await revokeCaSession(store, cookie);
    expect(await resolveCa(store, cookie)).toBeNull();
  });

  it("a broadcast request lands in every CA's inbox; the first to claim it holds it", async () => {
    const a = await ca(store, "084920");
    const b = await ca(store, "112233", "Meera Iyer");
    const created = await createReview(store, { mode: "wapc", owner, persona: sunita, regime: "new", background: { situation: "Salaried, Bengaluru", extras: [] }, clientNotes: "Please check my 80C" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.status).toBe("pending");
    expect((await store.listReviewsForCa(a.id)).open.map((r) => r.code)).toEqual([created.value.code]);
    expect((await store.listReviewsForCa(b.id)).open.map((r) => r.code)).toEqual([created.value.code]);

    const first = await claimReview(store, created.value.code, a);
    expect(first.ok && first.value.status).toBe("claimed");
    const second = await claimReview(store, created.value.code, b);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.status).toBe(409);
    expect((await store.listReviewsForCa(b.id)).open).toHaveLength(0);
    expect((await store.listReviewsForCa(a.id)).mine.map((r) => r.code)).toEqual([created.value.code]);
    expect((await store.listReviewsForPan(owner.pan)).map((r) => r.status)).toEqual(["claimed"]);
  });

  it("refuses a return that is not the signed-in person's, and an own-CA share without a PIN", async () => {
    const stranger = await createReview(store, { mode: "wapc", owner: { ...owner, pan: "ABCDE1234F" }, persona: sunita, regime: "new" });
    expect(stranger.ok).toBe(false);
    if (!stranger.ok) expect(stranger.status).toBe(403);
    const noPin = await createReview(store, { mode: "own", owner, persona: sunita, regime: "new" });
    expect(noPin.ok).toBe(false);
  });

  it("the CA's version comes back as reviewed with inline comments; the citizen decides; the PIN hash never leaves", async () => {
    const a = await ca(store, "084920");
    const created = await createReview(store, { mode: "wapc", owner, persona: sunita, regime: "new" });
    if (!created.ok) throw new Error(created.error);
    await claimReview(store, created.value.code, a);
    const comment = await addComment(store, created.value.code, { anchor: "deduction:80C", text: "PPF receipt is missing.", author: { role: "ca", name: a.name } });
    expect(comment.ok && comment.value.anchor).toBe("deduction:80C");
    const caPersona = structuredClone(sunita);
    caPersona.claims = [...caPersona.claims, { id: "ca_c1", section: "80C", amount: 150000, label: "PPF", evidenceAttached: true }];
    const sent = await submitReview(store, null, created.value.code, { caPersona, caRegime: "old", caNotes: "Old regime is cheaper with the PPF." }, a);
    expect(sent.ok && sent.value.status).toBe("reviewed");
    expect(sent.ok && sent.value.caDetails?.membershipNo).toBe("084920");
    expect((await store.getAccount(a.id))?.reviewCount).toBe(1);
    expect((await store.listComments(created.value.code)).map((c) => c.text)).toEqual(["PPF receipt is missing."]);

    const notMine = await decideReview(store, created.value.code, { ...owner, pan: "ABCDE1234F" }, true);
    expect(notMine.ok).toBe(false);
    const decided = await decideReview(store, created.value.code, owner, false);
    expect(decided.ok && decided.value.status).toBe("declined");
    expect("pinHash" in publicReview(created.value)).toBe(false);
  });
});

describe("compareReturns: the engine's cross-check of the two versions", () => {
  it("flags an income lowered below what the reporter filed as a risk and keeps the person's version", () => {
    const caPersona = structuredClone(sunita);
    const salary = caPersona.facts.find((f) => f.kind === "salary")!;
    salary.amount = Math.round(salary.amount * 0.8);
    const c = compareReturns(sunita, "new", caPersona, "new");
    expect(c.changes.some((x) => x.anchor === "income:salary")).toBe(true);
    expect(c.flags.some((f) => f.severity === "risk" && f.anchor === "income:salary")).toBe(true);
    expect(c.recommendation.pick).toBe("original");
  });

  it("an unchanged return is a draw with no changes", () => {
    const c = compareReturns(sunita, "new", structuredClone(sunita), "new");
    expect(c.changes).toHaveLength(0);
    expect(c.delta.refundOrDue).toBe(0);
    expect(c.recommendation.pick).toBe("either");
  });

  it("a documented deduction that lowers the tax is recommended, with the regime change listed", () => {
    const caPersona = structuredClone(sunita);
    caPersona.claims = [...caPersona.claims, { id: "ca_c1", section: "80C", amount: 150000, label: "PPF", evidenceAttached: true }];
    const c = compareReturns(sunita, "new", caPersona, "old");
    expect(c.changes.some((x) => x.kind === "regime")).toBe(true);
    expect(c.changes.some((x) => x.anchor === "deduction:80C")).toBe(true);
    expect(c.flags.some((f) => f.severity === "risk")).toBe(false);
    if (c.delta.totalTax < 0) expect(c.recommendation.pick).toBe("ca");
  });
});
