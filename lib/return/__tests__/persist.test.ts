import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CURRENT_VERSION,
  UNDO_CAP,
  load,
  migrate,
  popUndo,
  pushUndo,
  save,
  type StoredPayload,
} from "../persist";
import { applyCorrection, type ReturnState } from "../state";
import { installLocalStorageStub, makePersona } from "./fixtures";

function makeState(): ReturnState {
  const persona = makePersona();
  return {
    version: CURRENT_VERSION,
    lang: "en",
    personaId: persona.id,
    baselinePersona: persona,
    persona,
    corrections: [],
    confirmedFactIds: [],
  };
}

describe("migrate", () => {
  it("wraps a v0 raw-Persona payload into a v1 ReturnState preserving facts and disputes", () => {
    const persona = makePersona();
    persona.facts[1].dispute = { citizenAmount: 0, reason: "never earned this" };
    const migrated = migrate(JSON.parse(JSON.stringify(persona)));
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(CURRENT_VERSION);
    expect(migrated!.personaId).toBe(persona.id);
    expect(migrated!.lang).toBe(persona.preferredLang);
    expect(migrated!.baselinePersona).toEqual(persona);
    expect(migrated!.persona).toEqual(persona);
    expect(migrated!.persona.facts.find((f) => f.id === "fact-interest")?.dispute?.citizenAmount).toBe(0);
    expect(migrated!.corrections).toEqual([]);
    expect(migrated!.confirmedFactIds).toEqual([]);
  });

  it("passes a current-version wrapped payload through", () => {
    const state = makeState();
    const payload: StoredPayload = { version: CURRENT_VERSION, savedAt: "2026-08-25T09:00:00Z", state };
    expect(migrate(payload)).toEqual(state);
  });

  it("returns null for unrecognised shapes", () => {
    expect(migrate({ random: true })).toBeNull();
    expect(migrate(null)).toBeNull();
    expect(migrate(42)).toBeNull();
  });
});

describe("save/load round-trip", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips a state including corrections", () => {
    let state = makeState();
    state = applyCorrection(state, {
      id: "c1",
      factId: "fact-salary",
      field: "amount",
      previous: 900000,
      next: 850000,
      reason: "Form 16 says less",
      at: "2026-08-25T10:00:00Z",
    });
    save(state);

    const result = load();
    expect(result).toEqual({ state });
    if (result !== null && "state" in result) {
      expect(result.state.persona.facts[0].amount).toBe(850000);
    }
  });

  it("returns null when nothing is stored", () => {
    expect(load()).toBeNull();
  });

  it("returns null for corrupt JSON instead of throwing", () => {
    localStorage.setItem("wapsi_active_data", "{not json at all");
    expect(load()).toBeNull();
  });

  it("returns null for parseable JSON of no known shape", () => {
    localStorage.setItem("wapsi_active_data", JSON.stringify({ hello: "world" }));
    expect(load()).toBeNull();
  });

  it("migrates a legacy raw-Persona draft on load", () => {
    localStorage.setItem("wapsi_active_data", JSON.stringify(makePersona()));
    const result = load();
    expect(result).not.toBeNull();
    if (result !== null && "state" in result) {
      expect(result.state.version).toBe(CURRENT_VERSION);
      expect(result.state.corrections).toEqual([]);
    }
  });

  it("flags needsMigration for versions newer than this build", () => {
    const payload: StoredPayload = { version: CURRENT_VERSION + 1, savedAt: "x", state: makeState() };
    localStorage.setItem("wapsi_active_data", JSON.stringify(payload));
    expect(load()).toEqual({ needsMigration: true });
  });
});

describe("undo stack", () => {
  it("caps depth, silently dropping the oldest", () => {
    let stack: ReturnState[] = [];
    for (let i = 0; i < UNDO_CAP + 5; i++) {
      stack = pushUndo(stack, { ...makeState(), version: i });
    }
    expect(stack.length).toBe(UNDO_CAP);
    // oldest surviving is entry #5 (indices 0-4 dropped)
    expect(stack[0].version).toBe(5);
  });

  it("pop returns the newest snapshot and shrinks the stack", () => {
    const a = makeState();
    const b = { ...a, lang: "hi" as const };
    const pushed = pushUndo(pushUndo([], a), b);
    const { stack, state } = popUndo(pushed);
    expect(state).toEqual(b);
    expect(stack).toEqual([a]);
  });

  it("pop on an empty stack yields null without throwing", () => {
    expect(popUndo([])).toEqual({ stack: [], state: null });
  });
});
