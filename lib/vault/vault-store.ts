import type { BankAccount, Persona } from "../types";
import { PERSONAS } from "../personas";

export interface VaultDocument {
  id: string;
  title: string;
  docType: "FORM_16" | "ANNUAL_INFO_STATEMENT" | "FORM_26AS" | "BANK_STATEMENT" | "CHALLAN_280" | "ITR_V";
  issuer: string;
  uploadedAt: string;
  sizeKb: number;
  status: "verified" | "pending" | "disputed";
}

export interface CitizenVaultUser {
  id: string;
  pan: string;
  aadhaar?: string;
  fullName: string;
  mobile?: string;
  email?: string;
  dateOfBirth?: string;
  assessmentYear: string;
  status: "verified" | "draft" | "active";
  address?: string;
  banks: BankAccount[];
  documents: VaultDocument[];
  syncedToPostgres: boolean;
  lastSyncedAt?: string;
  dbStatus?: string;
  stats?: {
    salary?: number;
    tdsPaid?: number;
    refundDue?: number;
    advanceTaxPaid?: number;
  };
}

const STORAGE_KEY = "wapsi_citizen_vault_active";
const ALL_VAULTS_KEY = "wapsi_citizen_vaults_all";

/** Seed initial vault records for canonical reviewer personas. */
export function getSeededVaultForPersona(persona: Persona): CitizenVaultUser {
  const isSunita = persona.id === "sunita";
  const isRakesh = persona.id === "rakesh";
  const isPriya = persona.id === "priya";

  return {
    id: `vault_${persona.pan}`,
    pan: persona.pan,
    aadhaar: isSunita
      ? "7894 1234 5678"
      : isRakesh
      ? "9876 5432 1098"
      : "4567 8901 2345",
    fullName: persona.name,
    mobile: persona.mobile,
    email: isSunita
      ? "sunita.sharma@example.com"
      : isRakesh
      ? "rakesh.verma@example.com"
      : "priya.nair@example.com",
    dateOfBirth: isSunita ? "1988-04-12" : isRakesh ? "1956-08-25" : "1995-11-03",
    assessmentYear: persona.assessmentYear || "2026-27",
    status: "verified",
    address: `${persona.city}, ${persona.state}`,
    banks: persona.banks || [],
    documents: [
      {
        id: "doc_f16",
        title: `Form 16 Part A & B (${persona.name})`,
        docType: "FORM_16",
        issuer: isSunita ? "Infosys Ltd" : isRakesh ? "State Bank of India" : "Tech Mahindra Ltd",
        uploadedAt: "2026-06-15",
        sizeKb: 142,
        status: "verified",
      },
      {
        id: "doc_ais",
        title: "Annual Information Statement (AIS)",
        docType: "ANNUAL_INFO_STATEMENT",
        issuer: "Income Tax Department (CBDT)",
        uploadedAt: "2026-07-01",
        sizeKb: 284,
        status: "verified",
      },
      {
        id: "doc_26as",
        title: "Tax Credit Statement (Form 26AS)",
        docType: "FORM_26AS",
        issuer: "TRACES / NSDL",
        uploadedAt: "2026-07-05",
        sizeKb: 98,
        status: "verified",
      },
    ],
    syncedToPostgres: true,
    lastSyncedAt: new Date().toISOString(),
    dbStatus: "postgresql_active",
    stats: {
      salary: persona.facts?.find((f) => f.kind === "salary")?.amount,
      tdsPaid: persona.taxPaid?.reduce((sum, t) => sum + t.amount, 0),
      refundDue: persona.refund?.state === "determined" ? persona.refund.amount : 31170,
    },
  };
}

/** Get cached active vault user from localStorage. */
export function getLocalVaultUser(): CitizenVaultUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Save active vault user to localStorage. */
export function setLocalVaultUser(user: CitizenVaultUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    // Also persist in the map of all known vaults
    const allRaw = localStorage.getItem(ALL_VAULTS_KEY);
    const all = allRaw ? JSON.parse(allRaw) : {};
    all[user.pan] = user;
    localStorage.setItem(ALL_VAULTS_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("[VaultStore] Error writing to localStorage:", e);
  }
}

/** Sync user to /api/vault (which persists to PostgreSQL with fallback). */
export async function syncVaultUser(
  user: CitizenVaultUser
): Promise<{ ok: boolean; syncedToPostgres: boolean; dbStatus: string }> {
  setLocalVaultUser(user);

  try {
    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pan: user.pan,
        fullName: user.fullName,
        aadhaar: user.aadhaar,
        mobile: user.mobile,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        assessmentYear: user.assessmentYear,
        status: user.status,
        vaultData: {
          banks: user.banks,
          documents: user.documents,
          address: user.address,
          stats: user.stats,
        },
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const updated: CitizenVaultUser = {
      ...user,
      syncedToPostgres: Boolean(data.syncedToPostgres),
      dbStatus: data.dbStatus || (data.syncedToPostgres ? "postgresql_active" : "client_fallback"),
      lastSyncedAt: new Date().toISOString(),
    };

    setLocalVaultUser(updated);

    return {
      ok: true,
      syncedToPostgres: Boolean(data.syncedToPostgres),
      dbStatus: updated.dbStatus || "client_fallback",
    };
  } catch (err) {
    console.warn("[VaultStore] Backend sync failed, keeping local fallback:", err);
    return {
      ok: true,
      syncedToPostgres: false,
      dbStatus: "client_fallback",
    };
  }
}

/** Fetch user from /api/vault, falling back to local storage or persona data. */
export async function fetchVaultUser(pan: string): Promise<CitizenVaultUser | null> {
  const cleanPan = pan.trim().toUpperCase();

  // Try PostgreSQL via /api/vault
  try {
    const res = await fetch(`/api/vault?pan=${encodeURIComponent(cleanPan)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.user) {
        const row = data.user;
        const vaultData = (row.vault_data || {}) as Record<string, unknown>;
        const user: CitizenVaultUser = {
          id: row.id,
          pan: row.pan,
          aadhaar: row.aadhaar,
          fullName: row.full_name,
          mobile: row.mobile,
          email: row.email,
          dateOfBirth: row.date_of_birth,
          assessmentYear: row.assessment_year || "2026-27",
          status: row.status || "active",
          address: (vaultData.address as string) || undefined,
          banks: (vaultData.banks as BankAccount[]) || [],
          documents: (vaultData.documents as VaultDocument[]) || [],
          syncedToPostgres: data.dbStatus === "connected",
          dbStatus: data.dbStatus === "connected" ? "postgresql_active" : "client_fallback",
          lastSyncedAt: new Date().toISOString(),
          stats: vaultData.stats as CitizenVaultUser["stats"],
        };
        setLocalVaultUser(user);
        return user;
      }
    }
  } catch (e) {
    console.warn("[VaultStore] API fetch error:", e);
  }

  // Fallback to localStorage
  const local = getLocalVaultUser();
  if (local && local.pan === cleanPan) {
    return local;
  }

  // Fallback to personas if matching PAN
  for (const p of Object.values(PERSONAS)) {
    if (p.pan.toUpperCase() === cleanPan) {
      const seeded = getSeededVaultForPersona(p);
      setLocalVaultUser(seeded);
      return seeded;
    }
  }

  return null;
}

/** Create or initialize a minimal CitizenVaultUser from PAN alone. */
export function createVaultUserFromPan(
  pan: string,
  extra?: { fullName?: string; aadhaar?: string; document?: VaultDocument; clean?: boolean }
): CitizenVaultUser {
  const cleanPan = pan.trim().toUpperCase();
  const seeded = Object.values(PERSONAS).find((p) => p.pan.toUpperCase() === cleanPan);
  if (seeded && !extra?.clean) {
    const v = getSeededVaultForPersona(seeded);
    if (extra?.document) {
      v.documents = [extra.document, ...v.documents.filter((d) => d.id !== extra.document!.id)];
    }
    return v;
  }

  const derivedName = extra?.fullName?.trim() || `Citizen ${cleanPan.slice(5, 9)}`;
  const user: CitizenVaultUser = {
    id: `vault_${cleanPan}`,
    pan: cleanPan,
    aadhaar: extra?.aadhaar || undefined,
    fullName: derivedName,
    assessmentYear: "2026-27",
    status: "verified",
    banks: [
      {
        id: `bank_${cleanPan.slice(-4)}`,
        bank: "HDFC Bank",
        maskedNumber: `••••••••${cleanPan.slice(-4)}`,
        ifsc: "HDFC0001234",
        status: "validated",
        nominatedForRefund: true,
      },
    ],
    documents: extra?.document ? [extra.document] : [],
    syncedToPostgres: false,
    dbStatus: "client_fallback",
    lastSyncedAt: new Date().toISOString(),
    stats: {
      salary: 0,
      tdsPaid: 0,
      refundDue: 0,
      advanceTaxPaid: 0,
    },
  };
  return user;
}

/** Automatically add a document to a user's vault and sync immediately by default (never prompt). */
export async function addDocumentToVault(
  pan: string,
  doc: Omit<VaultDocument, "id" | "uploadedAt"> & { id?: string; uploadedAt?: string }
): Promise<CitizenVaultUser> {
  const cleanPan = pan.trim().toUpperCase();
  let user = await fetchVaultUser(cleanPan);
  if (!user) {
    user = createVaultUserFromPan(cleanPan);
  }

  const newDoc: VaultDocument = {
    id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: doc.title,
    docType: doc.docType,
    issuer: doc.issuer,
    uploadedAt: doc.uploadedAt || new Date().toISOString().slice(0, 10),
    sizeKb: doc.sizeKb || 120,
    status: doc.status || "verified",
  };

  const existingDocs = user.documents || [];
  // Deduplicate by title or id
  const filtered = existingDocs.filter((d) => d.id !== newDoc.id && d.title !== newDoc.title);
  const updatedUser: CitizenVaultUser = {
    ...user,
    documents: [newDoc, ...filtered],
  };

  setLocalVaultUser(updatedUser);
  void syncVaultUser(updatedUser);
  return updatedUser;
}
