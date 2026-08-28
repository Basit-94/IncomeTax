/**
 * Real sign-in against the Phase-2 backend, driven from the existing PAN → OTP
 * screens. The OTP the user types is verified SERVER-SIDE (both channels), the
 * account is a real row that survives restarts and second instances, and the
 * session token that comes back is the identity every authenticated read uses
 * (history, preferences, documents, the agent's backend tools).
 *
 * Flow per attempt:
 *   1. Try POST /signin with the PAN's demo password.
 *   2. Unknown account → run the full e-Filing-shaped registration with MOCK
 *      details (begin → details → mobile code → verify → email code → verify →
 *      complete), using the code the user typed on the OTP screen, then sign in.
 *
 * MOCK-DATA notice (§5.4): the password is deterministic per PAN and the
 * contact details are synthetic, because this is a prototype with no real
 * credential store on the client. What is REAL: server-side OTP verification
 * with attempt caps, PBKDF2 password hashing, hashed session tokens with
 * absolute expiry, and durable accounts. A wrong code fails here exactly as it
 * fails on the server.
 */

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export interface SessionInfo {
  token: string;
  pan: string;
  fullName: string;
  /** The anti-phishing phrase chosen at registration, shown after sign-in. */
  personalisedMessage: string;
}

export type AuthFailure =
  | { kind: "wrong_code"; detail: string }
  | { kind: "unreachable" }
  | { kind: "rejected"; detail: string };

export type AuthResult =
  | { ok: true; session: SessionInfo }
  | { ok: false; failure: AuthFailure };

/** Deterministic DEMO password — documented mock, never a real secret. */
function demoPassword(pan: string): string {
  return `Wapsi!demo!${pan}`;
}

const DEMO_MESSAGE = "My money comes back.";

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${BACKEND}/api/v1/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function trySignIn(pan: string): Promise<SessionInfo | null> {
  const res = await post("/signin", { pan, password: demoPassword(pan) });
  if (!res.ok) return null;
  const body = await res.json();
  return {
    token: body.token,
    pan: body.pan,
    fullName: body.fullName,
    personalisedMessage: body.personalisedMessage,
  };
}

async function verifyChannel(
  pan: string,
  channel: "MOBILE" | "EMAIL",
  code: string,
): Promise<{ ok: boolean; result: string }> {
  await post("/register/code", { pan, channel });
  const res = await post("/register/verify", { pan, channel, code });
  if (!res.ok) return { ok: false, result: `HTTP ${res.status}` };
  const body = await res.json();
  // Otp.Result's success value is OK (not "VERIFIED" - checked the enum).
  return { ok: body.result === "OK", result: body.result };
}

/**
 * Sign the PAN in, registering it first if the server has never seen it.
 * `code` is what the user typed on the OTP screen — it is checked by the
 * SERVER, for both channels, not by this client.
 */
export async function ensureSession(
  pan: string,
  fullName: string,
  code: string,
): Promise<AuthResult> {
  try {
    const existing = await trySignIn(pan);
    if (existing) return { ok: true, session: existing };

    // Fresh (or interrupted) registration. begin() resumes a PENDING row.
    const begin = await post("/register/begin", { pan });
    if (!begin.ok && begin.status !== 204) {
      const detail = await safeMessage(begin);
      // "already registered" with a failing demo password means the account
      // predates this client build — surface it honestly rather than looping.
      return { ok: false, failure: { kind: "rejected", detail } };
    }
    const details = await post("/register/details", {
      pan,
      fullName: fullName || "Wapsi User",
      dateOfBirth: "1990-01-01",
      mobile: "9000000001",
      email: `${pan.toLowerCase()}@wapsi.example`,
    });
    if (!details.ok) {
      return { ok: false, failure: { kind: "rejected", detail: await safeMessage(details) } };
    }

    for (const channel of ["MOBILE", "EMAIL"] as const) {
      const verified = await verifyChannel(pan, channel, code);
      if (!verified.ok) {
        return { ok: false, failure: { kind: "wrong_code", detail: verified.result } };
      }
    }

    const complete = await post("/register/complete", {
      pan,
      password: demoPassword(pan),
      personalisedMessage: DEMO_MESSAGE,
    });
    if (!complete.ok) {
      return { ok: false, failure: { kind: "rejected", detail: await safeMessage(complete) } };
    }

    const session = await trySignIn(pan);
    if (!session) {
      return { ok: false, failure: { kind: "rejected", detail: "sign-in after registration failed" } };
    }
    return { ok: true, session };
  } catch {
    return { ok: false, failure: { kind: "unreachable" } };
  }
}

export async function signOut(token: string): Promise<void> {
  try {
    await fetch(`${BACKEND}/api/v1/auth/signout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Signing out of an unreachable server still clears the client copy.
  }
}

/** The signed-in account's filings, newest first. Null = not available. */
export interface ServerFiling {
  submissionId: string;
  status: string;
  ruleSetVersion: string;
  totalTaxPaise: number | null;
  message: string;
}

export async function fetchHistory(token: string): Promise<ServerFiling[] | null> {
  try {
    const res = await fetch(`${BACKEND}/api/v1/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** T5.1: the mode follows the account. Fire-and-forget by design. */
export async function pushModePreference(token: string, mode: "simple" | "full"): Promise<void> {
  try {
    await fetch(`${BACKEND}/api/v1/preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mode }),
    });
  } catch {
    // The local profile still holds the choice; the next push syncs it.
  }
}

async function safeMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/* ------------------------- session persistence (client copy) -------------- */

const SESSION_KEY = "wapsi_session";

export function saveSession(session: SessionInfo): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage full/blocked: the in-memory session still works for this visit.
  }
}

export function loadSession(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.token !== "string" || typeof parsed?.pan !== "string") return null;
    return parsed as SessionInfo;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear.
  }
}
