import { describe, expect, it } from "vitest";
import {
  MemorySessionStore,
  SESSION_COOKIE,
  SessionResolver,
  clearedSessionCookie,
  ownsPan,
  readCookie,
  sessionCookie,
  verifyBackendToken,
} from "../session";

const cookieFor = (id: string) => `${SESSION_COOKIE}=${id}; other=1`;

describe("SessionResolver — demo sessions (plan §3.2)", () => {
  it("issues a demo session only for a seeded persona, and resolves it from the cookie", async () => {
    const r = new SessionResolver(new MemorySessionStore());
    const s = await r.issueDemo("sunita");
    expect(s).not.toBeNull();
    expect(s!.owner).toEqual({ pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" });
    expect(s!.kind).toBe("demo");

    const resolved = await r.resolve(cookieFor(s!.id));
    expect(resolved?.owner.pan).toBe("DEMPS4417K");
  });

  it("refuses a demo session for anything that is not a persona", async () => {
    const r = new SessionResolver(new MemorySessionStore());
    expect(await r.issueDemo("ABCDE1234F")).toBeNull();
    expect(await r.issueDemo("custom")).toBeNull();
  });

  it("does not resolve a forged, malformed or unknown cookie", async () => {
    const r = new SessionResolver(new MemorySessionStore());
    expect(await r.resolve(null)).toBeNull();
    expect(await r.resolve(cookieFor("not-hex"))).toBeNull();
    expect(await r.resolve(cookieFor("a".repeat(64)))).toBeNull();
  });

  it("expires: a session past its lifetime resolves to null and is removed", async () => {
    let now = new Date("2026-09-05T10:00:00Z");
    const store = new MemorySessionStore();
    const r = new SessionResolver(store, { now: () => now });
    const s = await r.issueDemo("rakesh");
    now = new Date("2026-09-05T22:00:01Z"); // 12h + 1s later
    expect(await r.resolve(cookieFor(s!.id))).toBeNull();
    now = new Date("2026-09-05T10:00:01Z");
    expect(await r.resolve(cookieFor(s!.id))).toBeNull(); // gone, not merely hidden
  });

  it("revoke removes the session", async () => {
    const r = new SessionResolver(new MemorySessionStore());
    const s = await r.issueDemo("priya");
    await r.revoke(cookieFor(s!.id));
    expect(await r.resolve(cookieFor(s!.id))).toBeNull();
  });

  it("ownsPan compares the session owner, case-insensitively, and fails without a session", async () => {
    const r = new SessionResolver(new MemorySessionStore());
    const s = await r.issueDemo("sunita");
    expect(ownsPan(s, "demps4417k")).toBe(true);
    expect(ownsPan(s, "DEMPK8823R")).toBe(false);
    expect(ownsPan(null, "DEMPS4417K")).toBe(false);
  });
});

describe("verifyBackendToken — the bridge (plan §3.2)", () => {
  const never: typeof fetch = async () => {
    throw new Error("must not be called");
  };

  it("refuses mock and client-minted tokens without contacting the backend", async () => {
    expect(await verifyBackendToken("mock-token-DEMPS4417K-1", "http://x", never)).toEqual({ ok: false, reason: "invalid_token" });
    expect(await verifyBackendToken("vault_session_ABCDE1234F_1", "http://x", never)).toEqual({ ok: false, reason: "invalid_token" });
    expect(await verifyBackendToken("", "http://x", never)).toEqual({ ok: false, reason: "invalid_token" });
  });

  it("distinguishes an unreachable backend from a rejected token", async () => {
    const down: typeof fetch = async () => {
      throw new TypeError("fetch failed");
    };
    expect(await verifyBackendToken("real", "http://x", down)).toEqual({ ok: false, reason: "backend_unreachable" });

    const rejects: typeof fetch = async () => new Response(null, { status: 401 });
    expect(await verifyBackendToken("real", "http://x", rejects)).toEqual({ ok: false, reason: "invalid_token" });
  });

  it("only the backend's answer becomes the owner, and it must be a well-formed PAN", async () => {
    const good: typeof fetch = async (url, init) => {
      expect(String(url)).toBe("http://x/api/v1/auth/session");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer real");
      return Response.json({ pan: "DEMPK8823R" });
    };
    const result = await verifyBackendToken("real", "http://x", good);
    expect(result).toEqual({ ok: true, owner: { pan: "DEMPK8823R", kind: "citizen", displayName: "Rakesh Kumar" } });

    const junk: typeof fetch = async () => Response.json({ pan: "not a pan" });
    expect(await verifyBackendToken("real", "http://x", junk)).toEqual({ ok: false, reason: "bad_answer" });
  });
});

describe("cookie helpers", () => {
  it("round-trips the session id and clears with Max-Age=0", () => {
    expect(readCookie("a=1; wapsi_sid=abc; b=2", "wapsi_sid")).toBe("abc");
    const cookie = sessionCookie(
      { id: "deadbeef", owner: { pan: "X", kind: "demo", displayName: "" }, kind: "demo", createdAt: "", expiresAt: new Date(Date.now() + 60_000).toISOString() },
      true,
    );
    expect(cookie).toContain("wapsi_sid=deadbeef");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(clearedSessionCookie(false)).toContain("Max-Age=0");
  });
});
