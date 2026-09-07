/**
 * Wapsi Registered CA Registry Store
 *
 * Provides self-registration for Chartered Accountants (ICAI accredited),
 * maintains the directory of verified CAs, and enables citizens to
 * request audit/review access asynchronously with granular permissions.
 */

import type { Persona, Lang } from "../types";
import {
  type CAReviewRecord,
  type ReviewPermissions,
  loadLocalReviews,
  saveLocalReviews,
  generateReviewCode,
  hashPin,
} from "./ca-store";

export interface RegisteredCA {
  id: string; // e.g. "ca_084920"
  name: string; // e.g. "CA Rajesh Sharma, FCA"
  membershipNo: string; // 6-digit ICAI number e.g. "084920"
  passwordHash?: string; // SHA-256 password hash for account sign in
  firmName: string; // e.g. "Sharma & Singhania Associates"
  city: string; // e.g. "New Delhi"
  state: string; // e.g. "Delhi"
  email: string;
  phone?: string;
  experienceYears: number;
  specialties: string[];
  bio?: string;
  rating: number; // e.g. 4.9
  reviewCount: number;
  isVerified: boolean;
  registeredAt: string;
}

export interface CARegistrationInput {
  name: string;
  membershipNo: string;
  password?: string;
  firmName: string;
  city: string;
  state?: string;
  email: string;
  phone?: string;
  experienceYears?: number;
  specialties?: string[];
  bio?: string;
}

export interface RequestReviewParams {
  caId: string;
  citizenPan: string;
  citizenName: string;
  assessmentYear?: string;
  pin: string;
  originalPersona: Persona;
  originalRegime: "new" | "old";
  permissions: ReviewPermissions;
  clientNotes?: string;
}

const CA_STORAGE_KEY = "wapsi_registered_cas";
const ACTIVE_CA_SESSION_KEY = "wapsi_active_ca_id";

/** Initial verified CAs representing major tax hubs across India */
export const SEED_REGISTERED_CAS: RegisteredCA[] = [];

declare global {
  // eslint-disable-next-line no-var
  var __WAPSI_REGISTERED_CAS__: RegisteredCA[] | undefined;
}

const memCas: RegisteredCA[] =
  globalThis.__WAPSI_REGISTERED_CAS__ ||
  (globalThis.__WAPSI_REGISTERED_CAS__ = []);

/**
 * Reset all registered CAs and pending review records (purge all CAs for clean slate).
 */
export function resetAllCAs(): void {
  memCas.length = 0;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(CA_STORAGE_KEY);
      localStorage.removeItem("wapsi_active_ca_id");
      localStorage.removeItem("wapsi_ca_reviews");
    } catch {
      // ignore
    }
  }
}

/**
 * Load all registered CAs from localStorage (fallback to memory and seeds).
 */
export function listRegisteredCAs(): RegisteredCA[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(CA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const map = new Map<string, RegisteredCA>();
          for (const ca of SEED_REGISTERED_CAS) map.set(ca.id, ca);
          for (const ca of parsed) map.set(ca.id, ca);
          const combined = Array.from(map.values());
          memCas.length = 0;
          memCas.push(...combined);
          return combined;
        }
      }
    } catch {
      // ignore
    }
  }
  return [...memCas];
}

/**
 * Save registered CAs to persistent storage.
 */
export function saveRegisteredCAs(cas: RegisteredCA[]): void {
  memCas.length = 0;
  memCas.push(...cas);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(CA_STORAGE_KEY, JSON.stringify(cas));
    } catch {
      // ignore
    }
  }
}

/**
 * Register a new Chartered Accountant with password.
 * Name, Membership No, and Password are the only mandatory inputs.
 */
export async function registerCA(input: CARegistrationInput): Promise<{ ok: boolean; ca?: RegisteredCA; error?: string }> {
  const cleanName = input.name.trim();
  const cleanMembership = input.membershipNo.replace(/[^0-9]/g, "").trim();
  const password = input.password?.trim() || "";

  if (!cleanName) return { ok: false, error: "Please enter your full name as registered with ICAI." };
  if (!cleanMembership || cleanMembership.length < 5 || cleanMembership.length > 7) {
    return { ok: false, error: "Please enter a valid 5 to 7 digit ICAI Membership Number." };
  }
  if (!password || password.length < 4) {
    return { ok: false, error: "Please create a password of at least 4 characters." };
  }

  const rawFirm = input.firmName?.trim();
  const cleanFirm = rawFirm || `${cleanName.startsWith("CA ") ? cleanName : `CA ${cleanName}`} & Co.`;
  const cleanCity = input.city?.trim() || "India";
  const rawEmail = input.email?.trim().toLowerCase();
  const cleanEmail = rawEmail && rawEmail.includes("@") ? rawEmail : `ca.${cleanMembership}@wapsi.tax`;

  const existingList = listRegisteredCAs();
  const existing = existingList.find(
    (c) =>
      c.membershipNo === cleanMembership ||
      (cleanEmail && c.email.toLowerCase() === cleanEmail) ||
      c.id === `ca_${cleanMembership}`
  );
  if (existing) {
    // If password provided, update existing CA password
    if (password) {
      existing.passwordHash = await hashPin(password);
      if (cleanFirm) existing.firmName = cleanFirm;
      if (cleanCity) existing.city = cleanCity;
      if (cleanEmail) existing.email = cleanEmail;
      saveRegisteredCAs(existingList);
    }
    setActiveCASession(existing.id);
    return {
      ok: true,
      ca: existing,
    };
  }

  const passwordHash = await hashPin(password);

  const newCA: RegisteredCA = {
    id: `ca_${cleanMembership}`,
    name: cleanName.startsWith("CA ") ? cleanName : `CA ${cleanName}`,
    membershipNo: cleanMembership,
    passwordHash,
    firmName: cleanFirm,
    city: cleanCity,
    state: input.state?.trim() || "India",
    email: cleanEmail,
    phone: input.phone?.trim() || "",
    experienceYears: input.experienceYears || 5,
    specialties: input.specialties && input.specialties.length > 0
      ? input.specialties
      : ["Income Tax Reconciliations", "Form 16 / AIS Audit", "Regime Choice"],
    bio: input.bio?.trim() || `ICAI Registered Chartered Accountant (#${cleanMembership}) practicing in ${cleanCity}.`,
    rating: 5.0,
    reviewCount: 0,
    isVerified: true,
    registeredAt: new Date().toISOString(),
  };

  const updated = [newCA, ...existingList];
  saveRegisteredCAs(updated);

  // Store as active CA session so CA dashboard opens directly
  setActiveCASession(newCA.id);

  // Proactively dispatch event
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wapsi_ca_registered", { detail: newCA }));
  }

  return { ok: true, ca: newCA };
}

/**
 * Sign in as an already registered Chartered Accountant using ICAI/Email/Name and Password.
 */
export async function loginCA(credentials: {
  identifier: string; // ICAI membership number, Email, or Name
  password: string;
}): Promise<{ ok: boolean; ca?: RegisteredCA; error?: string }> {
  const cleanId = credentials.identifier.trim().toLowerCase();
  const cleanNum = credentials.identifier.replace(/[^0-9]/g, "").trim();
  const cleanPass = credentials.password.trim();

  if (!cleanId) {
    return { ok: false, error: "Please enter your ICAI Membership Number, Name, or registered email." };
  }
  if (!cleanPass) {
    return { ok: false, error: "Please enter your account password." };
  }

  const cas = listRegisteredCAs();
  const target = cas.find((c) => {
    // 1. Membership Number match (raw or stripped)
    if (cleanNum && (c.membershipNo === cleanNum || c.membershipNo.replace(/^0+/, "") === cleanNum.replace(/^0+/, ""))) {
      return true;
    }
    // 2. Email match
    if (c.email.toLowerCase() === cleanId) {
      return true;
    }
    // 3. ID match
    if (c.id.toLowerCase() === cleanId || c.id.toLowerCase() === `ca_${cleanNum}`) {
      return true;
    }
    // 4. Name match (case-insensitive full name or without "CA " prefix)
    const normalizedCaName = c.name.toLowerCase().replace(/^ca\s+/, "").trim();
    const normalizedInput = cleanId.replace(/^ca\s+/, "").trim();
    if (c.name.toLowerCase() === cleanId || normalizedCaName === normalizedInput) {
      return true;
    }
    return false;
  });

  if (!target) {
    return { ok: false, error: "No registered CA account found with those credentials. Please register first." };
  }

  // If password was set, verify hash; for seeded demo CAs without hash, allow default "1234" or membershipNo
  if (target.passwordHash) {
    const inputHash = await hashPin(cleanPass);
    if (inputHash !== target.passwordHash) {
      return { ok: false, error: "Incorrect password. Please verify your credentials." };
    }
  } else {
    // Fallback default password
    if (cleanPass !== "1234" && cleanPass !== target.membershipNo) {
      return { ok: false, error: "Incorrect password for this CA account." };
    }
  }

  setActiveCASession(target.id);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wapsi_ca_logged_in", { detail: target }));
  }

  return { ok: true, ca: target };
}

/**
 * Get a registered CA by their unique ID or membership number.
 */
export function getRegisteredCA(idOrMembership: string): RegisteredCA | null {
  const cas = listRegisteredCAs();
  const clean = idOrMembership.trim();
  return cas.find((c) => c.id === clean || c.membershipNo === clean) || null;
}

/**
 * Set the currently logged-in registered CA ID.
 */
export function setActiveCASession(caId: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(ACTIVE_CA_SESSION_KEY, caId);
  }
}

/**
 * Get the currently logged-in registered CA.
 */
export function getActiveCASession(): RegisteredCA | null {
  if (typeof window !== "undefined" && window.localStorage) {
    const id = localStorage.getItem(ACTIVE_CA_SESSION_KEY);
    if (id) {
      return getRegisteredCA(id);
    }
  }
  return null;
}

/**
 * Clear CA session.
 */
export function clearCASession(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(ACTIVE_CA_SESSION_KEY);
  }
}

/**
 * Asynchronous citizen request: save return snapshot as a draft and assign to a CA.
 */
export async function requestCAReview(params: RequestReviewParams): Promise<CAReviewRecord> {
  const targetCA = getRegisteredCA(params.caId);
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
    // Enhanced fields for registered CA directory and async drafts
    targetCaId: targetCA ? targetCA.id : params.caId,
    targetCaName: targetCA ? targetCA.name : "Registered CA",
    permissions: params.permissions,
    clientNotes: params.clientNotes?.trim() || "",
    isDraft: true,
  };

  // Save to local reviews store
  const local = loadLocalReviews();
  local[code] = record;
  saveLocalReviews(local);

  // Sync with API
  if (typeof window !== "undefined") {
    try {
      fetch("/api/ca/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", record }),
      }).catch(() => {});
    } catch {
      // non-blocking
    }

    // Broadcast update
    window.dispatchEvent(new CustomEvent("wapsi_ca_review_updated", { detail: record }));
    window.dispatchEvent(new Event("storage"));
  }

  return record;
}

/**
 * List all pending draft review requests assigned to a registered CA.
 */
export function listDraftsForCA(caId: string): CAReviewRecord[] {
  const reviews = loadLocalReviews();
  const list = Object.values(reviews);
  const cleanId = caId.trim();

  return list
    .filter((r) => {
      if (r.status !== "pending") return false;
      return !r.targetCaId || r.targetCaId === cleanId;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
