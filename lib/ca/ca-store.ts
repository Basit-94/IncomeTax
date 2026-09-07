/**
 * Wapsi CA Review Store
 *
 * Facilitates trust-building human-in-the-loop tax return verification.
 * Taxpayers share an encrypted snapshot (Access Code + Security PIN) with
 * their Chartered Accountant or Tax Professional, who can audit, edit figures,
 * calculate regime-specific tax deltas, and leave advisory remarks.
 */

import type { Persona, Lang } from "../types";

export type CAReviewStatus = "pending" | "reviewed" | "accepted" | "rejected";

export interface CADetails {
  name: string;
  membershipNo?: string;
  firmName?: string;
}

export interface ReviewPermissions {
  allowEdit: boolean;
  shareAIS: boolean;
  shareForm16: boolean;
}

export interface CAReviewRecord {
  code: string; // E.g. "CA-7842-91"
  pinHash: string; // SHA-256 hex string
  citizenPan: string;
  citizenName: string;
  assessmentYear: string; // "2026-27"
  originalPersona: Persona;
  originalRegime: "new" | "old";
  caPersona?: Persona;
  caRegime?: "new" | "old";
  caDetails?: CADetails;
  caNotes?: string;
  status: CAReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  // Async draft & Registered CA directory support
  targetCaId?: string;
  targetCaName?: string;
  permissions?: ReviewPermissions;
  clientNotes?: string;
  isDraft?: boolean;
}

const STORAGE_KEY = "wapsi_ca_reviews";

/**
 * SHA-256 hash a citizen's PIN securely using Web Crypto API.
 */
export async function hashPin(pin: string): Promise<string> {
  const clean = String(pin).trim();
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback for simple environments
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(16) + "_" + clean.length;
}

/**
 * Generate a memorable, human-friendly CA Access Code (e.g. "CA-7842-91").
 */
export function generateReviewCode(): string {
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = Math.floor(10 + Math.random() * 90);
  return `CA-${part1}-${part2}`;
}

declare global {
  // eslint-disable-next-line no-var
  var __WAPSI_CA_REVIEWS__: Record<string, CAReviewRecord> | undefined;
}

const memStore: Record<string, CAReviewRecord> =
  globalThis.__WAPSI_CA_REVIEWS__ || (globalThis.__WAPSI_CA_REVIEWS__ = {});

/**
 * Read all reviews from localStorage (or memory store in Node/SSR).
 */
export function loadLocalReviews(): Record<string, CAReviewRecord> {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with memory store so server updates are visible
        Object.assign(memStore, parsed);
        return { ...memStore };
      }
    } catch {
      // fallback to memStore
    }
  }
  return { ...memStore };
}

/**
 * Save all reviews to localStorage (or memory store in Node/SSR).
 */
export function saveLocalReviews(reviews: Record<string, CAReviewRecord>): void {
  // Always update in-memory global store
  for (const k of Object.keys(memStore)) delete memStore[k];
  Object.assign(memStore, reviews);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch (err) {
      console.error("Failed to save CA reviews locally:", err);
    }
  }
}

/**
 * Create a new CA Review Record for a citizen draft.
 */
export async function createReviewRecord(params: {
  pin: string;
  citizenPan: string;
  citizenName: string;
  assessmentYear?: string;
  originalPersona: Persona;
  originalRegime: "new" | "old";
}): Promise<CAReviewRecord> {
  const code = generateReviewCode();
  const pinHash = await hashPin(params.pin);

  const record: CAReviewRecord = {
    code,
    pinHash,
    citizenPan: params.citizenPan.toUpperCase().trim(),
    citizenName: params.citizenName.trim(),
    assessmentYear: params.assessmentYear || "2026-27",
    originalPersona: JSON.parse(JSON.stringify(params.originalPersona)),
    originalRegime: params.originalRegime,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // 1. Save locally
  const local = loadLocalReviews();
  local[code] = record;
  saveLocalReviews(local);

  // 2. Sync to API in background
  try {
    if (typeof window !== "undefined") {
      fetch("/api/ca/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", record }),
      }).catch(() => {});
    }
  } catch {
    // API sync failure is non-blocking
  }

  return record;
}

/**
 * Fetch a CA review record by its code, checking local and querying server API for updates.
 */
export async function fetchReviewRecord(code: string, forceServer = false): Promise<CAReviewRecord | null> {
  const cleanCode = code.toUpperCase().trim();
  const local = loadLocalReviews();
  const cached = local[cleanCode];

  // If we have a cached reviewed/accepted record and not forcing server, return cached
  if (cached && (cached.status === "reviewed" || cached.status === "accepted") && !forceServer) {
    return cached;
  }

  // Query server API for latest multi-device/multi-tab status
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/ca/review?code=${encodeURIComponent(cleanCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.record) {
          local[cleanCode] = data.record;
          saveLocalReviews(local);
          return data.record;
        }
      }
    } catch {
      // Ignore network errors and use local fallback
    }
  }

  return cached || null;
}

/**
 * Verify if the entered PIN matches the record's stored pinHash.
 */
export async function verifyPin(record: CAReviewRecord, pin: string): Promise<boolean> {
  const hash = await hashPin(pin);
  return record.pinHash === hash;
}

/**
 * CA Submits their modifications, notes, and professional details.
 */
export async function submitCAReview(params: {
  code: string;
  caPersona: Persona;
  caRegime: "new" | "old";
  caNotes?: string;
  caDetails?: CADetails;
}): Promise<CAReviewRecord | null> {
  const cleanCode = params.code.toUpperCase().trim();
  const record = await fetchReviewRecord(cleanCode);
  if (!record) return null;

  const updated: CAReviewRecord = {
    ...record,
    caPersona: JSON.parse(JSON.stringify(params.caPersona)),
    caRegime: params.caRegime,
    caNotes: params.caNotes?.trim() || "",
    caDetails: params.caDetails,
    status: "reviewed",
    reviewedAt: new Date().toISOString(),
  };

  // Save local
  const local = loadLocalReviews();
  local[cleanCode] = updated;
  saveLocalReviews(local);

  // Sync to API
  if (typeof window !== "undefined") {
    try {
      await fetch("/api/ca/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", record: updated }),
      });
    } catch {
      // Non-blocking
    }

    // Proactively notify any listening components / tabs in real time
    try {
      window.dispatchEvent(new CustomEvent("wapsi_ca_review_updated", { detail: updated }));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore
    }
  }

  return updated;
}

/**
 * Citizen marks the CA review as accepted.
 */
export async function acceptCAReview(code: string): Promise<CAReviewRecord | null> {
  const cleanCode = code.toUpperCase().trim();
  const record = await fetchReviewRecord(cleanCode);
  if (!record) return null;

  const updated: CAReviewRecord = {
    ...record,
    status: "accepted",
  };

  const local = loadLocalReviews();
  local[cleanCode] = updated;
  saveLocalReviews(local);

  if (typeof window !== "undefined") {
    try {
      await fetch("/api/ca/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", code: cleanCode }),
      });
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent("wapsi_ca_review_updated", { detail: updated }));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }

  return updated;
}

/**
 * Get any active review record for a given citizen's PAN.
 */
export function getActiveReviewForPan(pan: string): CAReviewRecord | null {
  if (!pan) return null;
  const cleanPan = pan.toUpperCase().trim();
  const local = loadLocalReviews();
  const records = Object.values(local).filter((r) => r.citizenPan?.toUpperCase().trim() === cleanPan);
  if (!records.length) return null;
  // Return the most recently updated or reviewed one
  records.sort((a, b) => {
    const timeA = new Date(b.reviewedAt || b.createdAt).getTime();
    const timeB = new Date(a.reviewedAt || a.createdAt).getTime();
    return timeA - timeB;
  });
  return records[0];
}

/**
 * Retrieve the latest active or reviewed record for a citizen's PAN (alias for server/agent use).
 */
export const getLatestReviewForPan = getActiveReviewForPan;

/**
 * Generates an instant demo review with Sunita Rao for quick testing/evaluation.
 */
export async function createDemoReview(demoPersona: Persona): Promise<CAReviewRecord> {
  const code = "CA-DEMO-26";
  const pinHash = await hashPin("1234");

  // Create an enhanced CA persona with an optimized Old Regime scenario
  const caPersona: Persona = JSON.parse(JSON.stringify(demoPersona));
  
  // Add Section 80CCD(1B) NPS claim of ₹50,000
  if (!caPersona.claims.some((c) => c.section === "80CCD_1B" || c.label.includes("NPS"))) {
    caPersona.claims.push({
      id: "claim_ca_nps_80ccd",
      section: "80CCD_1B",
      amount: 50000,
      label: "Section 80CCD(1B) - National Pension System (NPS)",
      evidenceAttached: true,
    });
  }

  // Ensure 80D has adequate coverage
  const existing80D = caPersona.claims.find((c) => c.section.startsWith("80D"));
  if (existing80D) {
    existing80D.amount = 25000;
  } else {
    caPersona.claims.push({
      id: "claim_ca_80d",
      section: "80D_SELF",
      amount: 25000,
      label: "Section 80D - Health Insurance Premium",
      evidenceAttached: true,
    });
  }

  const record: CAReviewRecord = {
    code,
    pinHash,
    citizenPan: demoPersona.pan,
    citizenName: demoPersona.name,
    assessmentYear: "2026-27",
    originalPersona: JSON.parse(JSON.stringify(demoPersona)),
    originalRegime: "new",
    caPersona,
    caRegime: "old",
    caDetails: {
      name: "CA Rajesh Sharma, FCA",
      membershipNo: "084920",
      firmName: "Sharma & Singhania Associates, CAs",
    },
    caNotes:
      "Dear Sunita, I audited your Form 16 and AIS records. You have an eligible NPS Tier-1 contribution of ₹50,000 under Section 80CCD(1B) and ₹25,000 mediclaim premium under Section 80D that was not claimed. Switching to the Old Regime with these claims unlocks an additional ₹15,600 refund for you.",
    status: "reviewed",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    reviewedAt: new Date().toISOString(),
  };

  const local = loadLocalReviews();
  local[code] = record;
  saveLocalReviews(local);

  return record;
}
