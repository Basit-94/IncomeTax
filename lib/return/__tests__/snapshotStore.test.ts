import { describe, expect, it } from "vitest";
import type { Owner } from "../../server/session";
import { MemoryReturnStore } from "../snapshot-store";
import type { ReturnState } from "../state";
import { makePersona } from "./fixtures";

const owner: Owner = { pan: "DEMPX1234S", kind: "demo", displayName: "Sunita" };
const other: Owner = { pan: "DEMPK8823R", kind: "demo", displayName: "Rakesh" };
let n = 0;
const ctx = { now: () => `2026-09-05T12:00:${String(n++).padStart(2, "0")}.000Z`, newId: (p: string) => `${p}-${n}` };

function stateOf(): ReturnState {
  const persona = makePersona();
  return { version: 2, lang: "en", personaId: persona.id, baselinePersona: persona, persona, corrections: [], confirmedFactIds: [], regime: "new" };
}

describe("ReturnSnapshotStore — revisions, conflicts, idempotency (plan §3.3)", () => {
  it("replace creates at revision 1 and bumps on each accepted write", async () => {
    const store = new MemoryReturnStore(ctx);
    expect(await store.get(owner, "2026-27")).toBeNull();
    const r1 = await store.replace(owner, "2026-27", stateOf(), null);
    expect(r1).toMatchObject({ ok: true, snapshot: { revision: 1 } });
    const r2 = await store.replace(owner, "2026-27", stateOf(), 1);
    expect(r2).toMatchObject({ ok: true, snapshot: { revision: 2 } });
  });

  it("a stale replace is a conflict that hands back the current snapshot — no overwrite", async () => {
    const store = new MemoryReturnStore(ctx);
    await store.replace(owner, "2026-27", stateOf(), null);
    const agent = await store.apply(owner, "2026-27", { command: { type: "choose_regime", regime: "old" }, expectedRevision: 1, idempotencyKey: "k1", actor: "agent" });
    expect(agent).toMatchObject({ ok: true, snapshot: { revision: 2 } });
    const manual = await store.replace(owner, "2026-27", stateOf(), 1);
    expect(manual).toMatchObject({ ok: false, error: "conflict", current: { revision: 2 } });
    expect((await store.get(owner, "2026-27"))?.state.regime).toBe("old");
  });

  it("apply with a stale expected revision is a conflict; with the right one it advances", async () => {
    const store = new MemoryReturnStore(ctx);
    await store.replace(owner, "2026-27", stateOf(), null);
    const stale = await store.apply(owner, "2026-27", { command: { type: "confirm_fact", factId: "fact-salary" }, expectedRevision: 0, idempotencyKey: "a", actor: "agent" });
    expect(stale).toMatchObject({ ok: false, error: "conflict" });
    const fresh = await store.apply(owner, "2026-27", { command: { type: "confirm_fact", factId: "fact-salary" }, expectedRevision: 1, idempotencyKey: "b", actor: "agent" });
    expect(fresh).toMatchObject({ ok: true, changed: true, snapshot: { revision: 2 } });
  });

  it("a repeated idempotency key replays the first result without re-running the command", async () => {
    const store = new MemoryReturnStore(ctx);
    await store.replace(owner, "2026-27", stateOf(), null);
    const env = { command: { type: "correct_fact" as const, factId: "fact-salary", amount: 1, reason: "x" }, expectedRevision: 1, idempotencyKey: "same", actor: "agent" as const };
    const first = await store.apply(owner, "2026-27", env);
    const second = await store.apply(owner, "2026-27", { ...env, expectedRevision: 99 });
    expect(first).toMatchObject({ ok: true, snapshot: { revision: 2 }, replayed: false });
    expect(second).toMatchObject({ ok: true, snapshot: { revision: 2 }, replayed: true });
    expect((await store.get(owner, "2026-27"))?.state.corrections).toHaveLength(1);
  });

  it("a rejected command does not advance the revision", async () => {
    const store = new MemoryReturnStore(ctx);
    await store.replace(owner, "2026-27", stateOf(), null);
    const r = await store.apply(owner, "2026-27", { command: { type: "confirm_fact", factId: "ghost" }, expectedRevision: 1, idempotencyKey: "z", actor: "agent" });
    expect(r).toMatchObject({ ok: false, error: "rejected", current: { revision: 1 } });
  });

  it("owners are isolated; a missing return is not_found", async () => {
    const store = new MemoryReturnStore(ctx);
    await store.replace(owner, "2026-27", stateOf(), null);
    expect(await store.get(other, "2026-27")).toBeNull();
    expect(await store.apply(other, "2026-27", { command: { type: "sign_off_all" }, expectedRevision: 1, idempotencyKey: "q", actor: "agent" })).toEqual({ ok: false, error: "not_found" });
  });
});
