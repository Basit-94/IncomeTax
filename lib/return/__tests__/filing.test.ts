import { describe, expect, it } from "vitest";
import { buildSubmission, outcomeStampsFiled, simulatedFiling, submitReturn } from "../filing";
import { makePersona } from "./fixtures";

const req = { persona: makePersona(), regime: "new" as const, backendUrl: "http://backend" };

describe("submitReturn — outcomes are named, non-2xx never files (plan §8)", () => {
  it("accepted: 2xx with a submission id", async () => {
    const f: typeof fetch = async (url, init) => {
      expect(String(url)).toBe("http://backend/api/v1/returns/submit");
      const body = JSON.parse(String(init?.body));
      expect(body.citizenReference).toBe("DEMPX1234S");
      expect(body.facts[0].amountPaise).toBe(90_000_000);
      return Response.json({ submissionId: "SUB-1" });
    };
    const out = await submitReturn(req, f);
    expect(out.kind).toBe("accepted");
    expect(outcomeStampsFiled(out)).toBe(true);
  });

  it("failed: any non-2xx, with the server's message when it gives one", async () => {
    const f500: typeof fetch = async () => Response.json({ message: "ledger append failed" }, { status: 500 });
    const out = await submitReturn(req, f500);
    expect(out).toMatchObject({ kind: "failed", status: 500, detail: "ledger append failed" });
    expect(outcomeStampsFiled(out)).toBe(false);

    const f409: typeof fetch = async () => new Response("nope", { status: 409 });
    expect(await submitReturn(req, f409)).toMatchObject({ kind: "failed", status: 409, detail: "HTTP 409" });
  });

  it("failed: a 2xx without a submission id is not an acceptance", async () => {
    const f: typeof fetch = async () => Response.json({ ok: true });
    const out = await submitReturn(req, f);
    expect(out.kind).toBe("failed");
    expect(outcomeStampsFiled(out)).toBe(false);
  });

  it("unreachable: fetch threw — not filed, and distinct from failed", async () => {
    const f: typeof fetch = async () => {
      throw new TypeError("fetch failed");
    };
    const out = await submitReturn(req, f);
    expect(out.kind).toBe("unreachable");
    expect(outcomeStampsFiled(out)).toBe(false);
  });

  it("simulated: deterministic from the idempotency key, so a retry cannot mint a second receipt", () => {
    const { idempotencyKey } = buildSubmission(req);
    const a = simulatedFiling(idempotencyKey);
    const b = simulatedFiling(idempotencyKey);
    expect(a.submissionId).toBe(b.submissionId);
    expect(a.submissionId.startsWith("SIM-")).toBe(true);
    expect(outcomeStampsFiled(a)).toBe(true);
  });

  it("the idempotency key changes with the figures and the regime, not with time", () => {
    const k1 = buildSubmission(req).idempotencyKey;
    const k2 = buildSubmission(req).idempotencyKey;
    const k3 = buildSubmission({ ...req, regime: "old" }).idempotencyKey;
    expect(k1).toBe(k2);
    expect(k1).not.toBe(k3);
  });
});
