import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "../../server/db";
import { createUser } from "../../server/auth";
import { forgetDataKeys, putSlot, readSlotValues, resetVaultForTests, slotStatuses } from "../../server/vault";
import { beginConnect, completeConnect, consumeState, disconnect, getLink, mockIssued, pullIssued } from "../../server/digilocker";
import { validateAadhaar, validatePan } from "../../validation";

describe("digilocker mock", () => {
  beforeEach(() => {
    resetDbForTests();
    resetVaultForTests();
    forgetDataKeys();
  });

  it("issues stable, shape-valid identity documents per account", () => {
    const user = createUser("priya_s", "secret1");
    const a = mockIssued(user.id, user.username);
    const b = mockIssued(user.id, user.username);
    expect(a).toEqual(b);
    expect(validatePan(a.pan.value).ok).toBe(true);
    expect(a.pan.value.startsWith("DEMP")).toBe(true);
    expect(validateAadhaar(a.aadhaar.value).ok).toBe(true);
    expect(a.full_name.value.startsWith("Priya S")).toBe(true);
    expect(a.dob.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("walks the OAuth-shaped flow and never overwrites what the person typed", () => {
    const user = createUser("asabs", "12345");
    const { state, redirect } = beginConnect(user.id);
    expect(redirect).toContain("/digilocker/consent?state=");
    expect(consumeState("nope")).toBeNull();
    expect(consumeState(state)).toBe(user.id);
    expect(consumeState(state)).toBeNull();
    expect(() => completeConnect(user.id, "real-code")).toThrow();
    expect(getLink(user.id)).toBeNull();
    completeConnect(user.id, "mock-abc");
    expect(getLink(user.id)?.scope).toEqual(["pan", "aadhaar", "full_name", "dob"]);
    // A typed PAN stays; the other three come from the locker, verified.
    putSlot(user.id, "pan", "DEMPS4417K", { masked: "DEXXXXXX7K", source: "user" });
    const pulled = pullIssued(user.id, user.username);
    expect(pulled.skipped).toEqual(["pan"]);
    expect(pulled.filled.map((f) => f.slotId)).toEqual(["aadhaar", "full_name", "dob"]);
    const statuses = slotStatuses(user.id);
    expect(statuses.aadhaar.source).toBe("digilocker");
    expect(statuses.aadhaar.verified).toBe(true);
    expect(readSlotValues(user.id, ["pan"], { actor: "user" }).pan).toBe("DEMPS4417K");
    disconnect(user.id);
    expect(getLink(user.id)).toBeNull();
    expect(() => pullIssued(user.id, user.username)).toThrow("not linked");
  });
});
