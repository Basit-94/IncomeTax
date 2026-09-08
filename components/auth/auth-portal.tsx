"use client";

/**
 * The sign-in card (handoff 2, 2026-09-07 — desktop 1a–1p, mobile M2). Two tabs only: Citizen and
 * Chartered Accountant. Sign-up and document sign-in are sub-views reached from links under the PAN
 * box and left with "Back to sign in"; the demo citizens (1p) open from the landing's "Try a demo".
 * Every handler below the state block is the one the old four-tab card used, unchanged.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  UserRound,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  HelpCircle,
  KeyRound,
  Award,
  Sparkles,
} from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Lang, PersonaId } from "@/lib/types";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";
import { PERSONAS } from "@/lib/personas";
import { localizeName } from "@/lib/i18n/names";
import {
  syncVaultUser,
  createVaultUserFromPan,
  addDocumentToVault,
  type CitizenVaultUser,
  type VaultDocument,
} from "@/lib/vault/vault-store";
import { extractFieldsFromPdf, detectDocumentKind, isEmptyExtraction, decodeLatin1, type ExtractedFields } from "@/lib/compliance/pdfExtract";
import { createDemoReview, fetchReviewRecord, verifyPin } from "@/lib/ca/ca-store";
import { registerCA, loginCA, type RegisteredCA } from "@/lib/ca/ca-registry";
import type { IngestedDocument } from "@/context/TaxReturnContext";
import { Munshi } from "../brand/munshi";
import { recordActivity } from "@/lib/telemetry/client";


interface AuthPortalProps {
  t: Dict;
  lang?: Lang;
  panInput: string;
  panInputError: string | null;
  onPanChange: (pan: string) => void;
  onPanSubmit: (e: React.FormEvent) => void;
  onLaunchPersona?: (personaId: PersonaId | "custom", directToDashboard?: boolean) => void;
  onSignUpComplete?: (user: CitizenVaultUser) => void;
  onLaunchWithForm16?: (doc: IngestedDocument) => void;
  /** Which view opens first; the dedicated /signin page uses this for "Try a demo citizen" links. */
  initialTab?: "signin" | "signup" | "document" | "personas";
  authBusy?: boolean;
}

/** Citizen and CA are the tabs; sign-up, document and the demo list are sub-views with a Back link. */
type AuthView = "citizen" | "ca" | "signup" | "doc" | "personas";

const VIEW_FOR_TAB: Record<NonNullable<AuthPortalProps["initialTab"]>, AuthView> = {
  signin: "citizen",
  signup: "signup",
  document: "doc",
  personas: "personas",
};

/** The handoff's inputs: 54 px, white .8 fill, 1.5 px glass border; PAN/code fields mono 20 px centred. */
const FIELD = "w-full rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] text-ink outline-none transition-[border-color,box-shadow]";
const FIELD_OK = "border-glass-edge focus:border-money focus:shadow-[0_0_0_3px_rgba(255,122,26,.18)]";
const FIELD_BAD = "border-bad shadow-[0_0_0_3px_rgba(217,64,58,.15)]";
const MONO_FIELD = `${FIELD} h-[54px] max-md:h-[52px] px-4 text-center font-mono text-[20px] max-md:text-[18px] font-semibold uppercase tracking-[.14em]`;
const LABEL = "block text-[12.5px] font-bold text-ink-2 mb-1.5";
const PRIMARY = "btn-primary flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] px-5 text-[14.5px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-45";
/** On phones the primary action is pinned above the home indicator in a paper fade (M2); a no-op wrapper from `md`. */
const PINNED = "md:contents max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:px-4 max-md:pb-7 max-md:pt-2.5 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)]";

export default function AuthPortal({
  t,
  lang = "en",
  panInput,
  panInputError,
  onPanChange,
  onPanSubmit,
  onLaunchPersona,
  onSignUpComplete,
  onLaunchWithForm16,
  initialTab,
}: AuthPortalProps) {
  const router = useRouter();
  const [view, setView] = useState<AuthView>(initialTab ? VIEW_FOR_TAB[initialTab] : "citizen");
  const ps = getPortalStrings(lang || "en");

  useEffect(() => {
    if (initialTab) setView(VIEW_FOR_TAB[initialTab]);
  }, [initialTab]);

  // --- Chartered Accountant tab: code + PIN, verified here, then handed to /ca (sessionStorage, read once) ---
  const [caCode, setCaCode] = useState("");
  const [caPin, setCaPin] = useState("");
  const [caName, setCaName] = useState("");
  const [caMembership, setCaMembership] = useState("");
  const [caError, setCaError] = useState<string | null>(null);
  const [caBusy, setCaBusy] = useState(false);

  // CA Self-Registration and Account Login state
  const [caSubView, setCaSubView] = useState<"client_code" | "account_login">("client_code");
  const [isCaRegisterOpen, setIsCaRegisterOpen] = useState(false);
  const [regCaName, setRegCaName] = useState("");
  const [regCaMembership, setRegCaMembership] = useState("");
  const [regCaPassword, setRegCaPassword] = useState("");
  const [regCaFirm, setRegCaFirm] = useState("");
  const [regCaCity, setRegCaCity] = useState("");
  const [regCaEmail, setRegCaEmail] = useState("");
  const [regCaPhone, setRegCaPhone] = useState("");
  const [regCaError, setRegCaError] = useState<string | null>(null);
  const [regCaSuccess, setRegCaSuccess] = useState(false);
  const [isRegisteringCa, setIsRegisteringCa] = useState(false);

  // CA Account Direct Login state (ICAI/Email + Password)
  const [caLoginId, setCaLoginId] = useState("");
  const [caLoginPassword, setCaLoginPassword] = useState("");
  const [caAccountError, setCaAccountError] = useState<string | null>(null);
  const [caAccountBusy, setCaAccountBusy] = useState(false);

  const handleCaRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegCaError(null);
    setIsRegisteringCa(true);

    try {
      const res = await registerCA({
        name: regCaName,
        membershipNo: regCaMembership,
        password: regCaPassword,
        firmName: regCaFirm,
        city: regCaCity,
        email: regCaEmail,
        phone: regCaPhone,
      });

      if (!res.ok || !res.ca) {
        setRegCaError(res.error || "Registration failed. Check your ICAI details.");
        setIsRegisteringCa(false);
        return;
      }

      setRegCaSuccess(true);
      setTimeout(() => {
        setIsCaRegisterOpen(false);
        router.push("/ca");
      }, 1200);
    } catch (err) {
      setRegCaError(err instanceof Error ? err.message : "Error saving CA registration");
    } finally {
      setIsRegisteringCa(false);
    }
  };

  const handleCaAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaAccountError(null);
    setCaAccountBusy(true);

    try {
      const res = await loginCA({
        identifier: caLoginId,
        password: caLoginPassword,
      });

      if (!res.ok || !res.ca) {
        setCaAccountError(res.error || "Invalid ICAI number/email or password");
        setCaAccountBusy(false);
        return;
      }

      router.push("/ca");
    } catch (err) {
      setCaAccountError(err instanceof Error ? err.message : "Sign in error");
    } finally {
      setCaAccountBusy(false);
    }
  };

  const openCaReview = (code: string, pin: string) => {
    try {
      sessionStorage.setItem("wapsi_ca_handoff", JSON.stringify({ code, pin, name: caName.trim(), membershipNo: caMembership.trim() }));
    } catch {
      // the /ca page still shows its own login when the handoff cannot be stored
    }
    router.push(`/ca?code=${encodeURIComponent(code)}`);
  };

  const handleCaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = caCode.trim().toUpperCase();
    const pin = caPin.trim();
    if (!code || !pin) {
      setCaError(ps.caEnterBoth);
      return;
    }
    setCaBusy(true);
    setCaError(null);
    try {
      const rec = await fetchReviewRecord(code);
      if (!rec) {
        setCaError(ps.caNoDraft);
        return;
      }
      if (!(await verifyPin(rec, pin))) {
        setCaError(ps.caWrongPin);
        return;
      }
      openCaReview(code, pin);
    } catch {
      setCaError(ps.docError);
    } finally {
      setCaBusy(false);
    }
  };

  const handleCaDemo = async () => {
    setCaBusy(true);
    setCaError(null);
    try {
      const rec = await createDemoReview(PERSONAS.sunita);
      openCaReview(rec.code, "1234");
    } finally {
      setCaBusy(false);
    }
  };

  // --- Sign Up Form State (Strictly PAN-only per directive) ---
  const [signUpPan, setSignUpPan] = useState("");
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [isSubmittingSignUp, setIsSubmittingSignUp] = useState(false);

  // --- Document Sign In State ---
  const [docPhase, setDocPhase] = useState<"idle" | "reading" | "success" | "manual_pan" | "error">("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedPan, setExtractedPan] = useState<string>("");
  const [extractedData, setExtractedData] = useState<{
    name?: string;
    employerName?: string;
    grossSalary?: number;
    tds?: number;
    kind?: "FORM_16" | "AIS";
    otherIncome?: ExtractedFields["otherIncome"];
    tdsOther?: ExtractedFields["tdsOther"];
    exemptAllowances?: ExtractedFields["exemptAllowances"];
    employerClaims?: ExtractedFields["employerClaims"];
    ltcg112A?: ExtractedFields["ltcg112A"];
  }>({});
  const [manualPanForDoc, setManualPanForDoc] = useState<string>("");
  const [docStatusMsg, setDocStatusMsg] = useState<string>("");
  const [isDocLaunching, setIsDocLaunching] = useState(false);
  const lastIngestedRef = useRef<IngestedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Indian PAN format regex: 5 uppercase letters, 4 digits, 1 uppercase letter
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = signUpPan.trim().toUpperCase();

    if (!cleanPan || cleanPan.length !== 10) {
      setSignUpError(ps.panRequiredError);
      return;
    }

    if (!PAN_REGEX.test(cleanPan)) {
      setSignUpError(ps.panRegexError);
      return;
    }

    setIsSubmittingSignUp(true);
    setSignUpError(null);

    try {
      // Create clean citizen vault record from PAN alone (zero prefilled amounts)
      const newUser = createVaultUserFromPan(cleanPan, { clean: true });

      // Automatically sync to PostgreSQL database by default (no user prompt)
      const syncResult = await syncVaultUser(newUser);
      newUser.syncedToPostgres = syncResult.syncedToPostgres;
      newUser.dbStatus = syncResult.dbStatus;

      onPanChange(cleanPan);

      if (onSignUpComplete) {
        onSignUpComplete(newUser);
      } else {
        onPanSubmit(e);
      }
    } catch (err) {
      setSignUpError("Registration error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingSignUp(false);
    }
  };

  // --- Process File Upload for Document Sign In ---
  const processDocument = useCallback(
    async (file: File) => {
      setUploadedFile(file);
      setDocPhase("reading");
      setDocStatusMsg(ps.readingDoc);
      setIsDocLaunching(false);

      try {
        let foundPan: string | undefined = undefined;
        let detectedName: string | undefined = undefined;
        let employerName: string | undefined = undefined;
        let grossSalary: number | undefined = undefined;
        let tdsAmount: number | undefined = undefined;
        let detectedKind: "FORM_16" | "AIS" = "FORM_16";

        let extractedRaw: Awaited<ReturnType<typeof extractFieldsFromPdf>> | undefined = undefined;

        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          detectedKind = detectDocumentKind(bytes, file.name);
          if (/ais|tis|annual\s*info/i.test(file.name)) {
            detectedKind = "AIS";
          }
          const extracted = await extractFieldsFromPdf(bytes);
          extractedRaw = extracted;

          if (!isEmptyExtraction(extracted)) {
            foundPan = extracted.pan;
            detectedName = extracted.name;
            employerName = extracted.employerName;
            grossSalary = extracted.grossSalary;
            tdsAmount = extracted.tds;
          }

          // Fallback search in raw text stream if PAN was not matched yet
          if (!foundPan) {
            const rawText = decodeLatin1(bytes);
            // 1. Spaced PAN (e.g. A B C D E 1 2 3 4 F)
            const spaced = rawText.match(/(?:PAN|Permanent Account)?[^A-Za-z0-9]{0,40}([A-Za-z]\s+[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]\s+[0-9]\s+[0-9]\s+[0-9]\s+[0-9]\s+[A-Za-z])/i);
            if (spaced) {
              const candidate = spaced[1].replace(/\s+/g, "").toUpperCase();
              if (PAN_REGEX.test(candidate)) foundPan = candidate;
            }
            // 2. Case-insensitive labelled PAN
            if (!foundPan) {
              const labelled = rawText.match(/(?:Employee|Deductee|Assessee|Citizen)?[\s\S]{0,30}?(?:PAN|Permanent Account)[^A-Za-z0-9]{0,25}([A-Za-z]{5}[0-9]{4}[A-Za-z])/i);
              if (labelled) {
                const candidate = labelled[1].toUpperCase();
                if (PAN_REGEX.test(candidate)) foundPan = candidate;
              }
            }
            // 3. Individual PAN fallback (4th char 'P')
            if (!foundPan) {
              const allPans = rawText.match(/[A-Za-z]{5}[0-9]{4}[A-Za-z]/g);
              if (allPans && allPans.length > 0) {
                const personalPan = allPans.find((p) => p[3].toUpperCase() === "P");
                foundPan = (personalPan || allPans[0]).toUpperCase();
              }
            }
          }
        } else {
          // For text, json, or other documents, read text stream
          const text = await file.text();
          const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/i);
          if (panMatch) {
            foundPan = panMatch[0].toUpperCase();
          }
          const nameMatch = text.match(/(?:Name of (?:the )?Employee|Name of (?:the )?Deductee|Name)[\s:]+([A-Za-z\s]{3,35})/i);
          if (nameMatch) {
            detectedName = nameMatch[1].trim();
          }
        }

        // File name heuristic if name is still missing
        if (!detectedName && file.name) {
          const cleanBase = file.name.replace(/\.[^/.]+$/, "");
          const m = cleanBase.match(/(?:AIS\s*(?:_\s*|\/\s*)TIS\s*(?:Statement)?\s*-\s*|Form\s*16\s*-\s*)([A-Za-z'’.\s]{2,40})/i);
          if (m) detectedName = m[1].trim();
        }

        // Progressive AI enhancement via /api/extract (Gemini Document Intelligence)
        try {
          const aiRes = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              kind: detectedKind,
              extracted: {
                pan: foundPan,
                name: detectedName,
                employerName,
                grossSalary,
                tds: tdsAmount,
                otherIncome: extractedRaw?.otherIncome,
                tdsOther: extractedRaw?.tdsOther,
                exemptAllowances: extractedRaw?.exemptAllowances,
                employerClaims: extractedRaw?.employerClaims,
                ltcg112A: extractedRaw?.ltcg112A,
              },
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            if (aiData.data) {
              if (aiData.data.pan && PAN_REGEX.test(aiData.data.pan)) foundPan = aiData.data.pan;
              if (aiData.data.name && (!detectedName || /citizen/i.test(detectedName))) detectedName = aiData.data.name;
              if (aiData.data.employerName && !employerName) employerName = aiData.data.employerName;
              if (typeof aiData.data.grossSalary === "number" && grossSalary === undefined) grossSalary = aiData.data.grossSalary;
              if (typeof aiData.data.tds === "number" && tdsAmount === undefined) tdsAmount = aiData.data.tds;
              if (aiData.data.kind) {
                if (/ais|tis|annual\s*info/i.test(file.name)) {
                  detectedKind = "AIS";
                } else {
                  detectedKind = aiData.data.kind;
                }
              }
            }
          }
        } catch {
          // AI extraction is progressive enhancement; deterministic extraction stands
        }

        setExtractedData({
          name: detectedName,
          employerName,
          grossSalary,
          tds: tdsAmount,
          kind: detectedKind,
          otherIncome: extractedRaw?.otherIncome,
          tdsOther: extractedRaw?.tdsOther,
          exemptAllowances: extractedRaw?.exemptAllowances,
          employerClaims: extractedRaw?.employerClaims,
          ltcg112A: extractedRaw?.ltcg112A,
        });

        // Slight parse beat for high-trust user feedback
        await new Promise((r) => setTimeout(r, 400));

        if (foundPan && PAN_REGEX.test(foundPan.trim().toUpperCase())) {
          const cleanPan = foundPan.trim().toUpperCase();
          setExtractedPan(cleanPan);
          setDocPhase("success");
          setDocStatusMsg(detectedName ? `${detectedName} (${cleanPan})` : `${cleanPan}: ${ps.readingDoc}`);

          // 1. Automatically store document in Citizen Tax Vault by default
          const vaultDoc: VaultDocument = {
            id: `doc_${Date.now()}`,
            title: file.name,
            docType: detectedKind === "AIS" ? "ANNUAL_INFO_STATEMENT" : "FORM_16",
            issuer: employerName || (detectedKind === "AIS" ? "Income Tax Department" : "Uploaded Tax Document"),
            uploadedAt: new Date().toISOString().slice(0, 10),
            sizeKb: Math.max(1, Math.round(file.size / 1024)),
            status: "verified",
            provenance: "uploaded",
            hasOriginalBytes: true,
            fields: {
              pan: cleanPan,
              name: detectedName,
              employerName,
              grossSalary,
              tds: tdsAmount,
              otherIncome: extractedRaw?.otherIncome,
              tdsOther: extractedRaw?.tdsOther,
              exemptAllowances: extractedRaw?.exemptAllowances,
              employerClaims: extractedRaw?.employerClaims,
              ltcg112A: extractedRaw?.ltcg112A,
            },
          };

          const updatedUser = await addDocumentToVault(cleanPan, vaultDoc);

          // 2. Prepare ingested document
          const ingested: IngestedDocument = {
            fileName: file.name,
            kind: detectedKind,
            ingestedAt: new Date().toISOString(),
            extracted: {
              pan: cleanPan,
              name: detectedName,
              employerName,
              grossSalary,
              tds: tdsAmount,
              otherIncome: extractedRaw?.otherIncome,
              tdsOther: extractedRaw?.tdsOther,
              exemptAllowances: extractedRaw?.exemptAllowances,
              employerClaims: extractedRaw?.employerClaims,
              ltcg112A: extractedRaw?.ltcg112A,
            },
            file,
          };
          lastIngestedRef.current = ingested;

          onPanChange(cleanPan);

          // 3. Log user in directly
          setIsDocLaunching(true);
          try {
            if (onLaunchWithForm16) {
              await onLaunchWithForm16(ingested);
            } else if (onSignUpComplete) {
              await onSignUpComplete(updatedUser);
            }
          } catch (launchErr) {
            setIsDocLaunching(false);
            setDocPhase("error");
            setDocStatusMsg(launchErr instanceof Error ? launchErr.message : String(launchErr));
          }
        } else {
          // Document was read, but no 10-character PAN found in text stream
          setDocPhase("manual_pan");
          setDocStatusMsg(ps.panOnlySub);
        }
      } catch {
        setIsDocLaunching(false);
        setDocPhase("error");
        setDocStatusMsg(ps.docError);
      }
    },
    [ps, onLaunchWithForm16, onPanChange, onSignUpComplete]
  );

  const handleLoadSampleDoc = useCallback(
    async (fileName: string) => {
      try {
        setDocPhase("reading");
        setDocStatusMsg(`Loading sample document: ${fileName}…`);
        const res = await fetch(`/samples/${encodeURIComponent(fileName)}`);
        if (!res.ok) throw new Error("Could not fetch sample document");
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: "application/pdf" });
        await processDocument(file);
      } catch (err) {
        setDocPhase("error");
        setDocStatusMsg(err instanceof Error ? err.message : "Failed to load sample document");
      }
    },
    [processDocument]
  );

  const handleManualPanForDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = manualPanForDoc.trim().toUpperCase();

    if (!cleanPan || !PAN_REGEX.test(cleanPan)) {
      setDocStatusMsg(ps.panRegexError);
      return;
    }

    if (!uploadedFile) {
      setDocStatusMsg("Please select a tax document first.");
      return;
    }

    setDocPhase("reading");
    setDocStatusMsg(ps.readingDoc);
    setIsDocLaunching(true);

    try {
      const detectedKind =
        extractedData.kind ||
        (/ais|tis|annual\s*info/i.test(uploadedFile.name) ? "AIS" : "FORM_16");
      const vaultDoc: VaultDocument = {
        id: `doc_${Date.now()}`,
        title: uploadedFile.name,
        docType: detectedKind === "AIS" ? "ANNUAL_INFO_STATEMENT" : "FORM_16",
        issuer: extractedData.employerName || (detectedKind === "AIS" ? "Income Tax Department" : "Citizen Tax Document"),
        uploadedAt: new Date().toISOString().slice(0, 10),
        sizeKb: Math.max(1, Math.round(uploadedFile.size / 1024)),
        status: "verified",
        provenance: "uploaded",
        hasOriginalBytes: true,
        fields: {
          pan: cleanPan,
          name: extractedData.name,
          employerName: extractedData.employerName,
          grossSalary: extractedData.grossSalary,
          tds: extractedData.tds,
          otherIncome: extractedData.otherIncome,
          tdsOther: extractedData.tdsOther,
          exemptAllowances: extractedData.exemptAllowances,
          employerClaims: extractedData.employerClaims,
          ltcg112A: extractedData.ltcg112A,
        },
      };

      // Auto-stored in vault by default without prompting
      const updatedUser = await addDocumentToVault(cleanPan, vaultDoc);

      const ingested: IngestedDocument = {
        fileName: uploadedFile.name,
        kind: detectedKind,
        ingestedAt: new Date().toISOString(),
        extracted: {
          pan: cleanPan,
          name: extractedData.name,
          employerName: extractedData.employerName,
          grossSalary: extractedData.grossSalary,
          tds: extractedData.tds,
          otherIncome: extractedData.otherIncome,
          tdsOther: extractedData.tdsOther,
          exemptAllowances: extractedData.exemptAllowances,
          employerClaims: extractedData.employerClaims,
          ltcg112A: extractedData.ltcg112A,
        },
        file: uploadedFile,
      };
      lastIngestedRef.current = ingested;

      onPanChange(cleanPan);
      recordActivity(
        "upload_doc",
        { filename: uploadedFile.name, kind: detectedKind, grossSalary: extractedData.grossSalary, tds: extractedData.tds },
        { pan: cleanPan, userName: extractedData.name, lang },
      );

      if (onLaunchWithForm16) {

        await onLaunchWithForm16(ingested);
      } else if (onSignUpComplete) {
        await onSignUpComplete(updatedUser);
      }
    } catch (err) {
      setIsDocLaunching(false);
      setDocPhase("error");
      setDocStatusMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const footer = (
    <div className="mt-auto flex items-center justify-between pt-1.5 font-mono text-[11px] text-ink-3">
      <span className="flex items-center gap-1.5 text-ok">
        <Lock size={12} />
        <span>{ps.bankGrade}</span>
      </span>
      <span>{ps.authorizedOnly}</span>
    </div>
  );

  const backLink = (
    <button type="button" onClick={() => setView("citizen")} className="inline-flex items-center gap-2 self-start text-[13.5px] font-semibold text-ink-2 hover:text-ink cursor-pointer">
      <ChevronLeft size={16} aria-hidden="true" />
      <span>{ps.backToSignIn}</span>
    </button>
  );

  const checks = [
    { dot: "bg-money", title: ps.disc1Title, desc: ps.disc1Desc },
    { dot: "bg-tertiary", title: ps.disc2Title, desc: ps.disc2Desc },
    { dot: "bg-ok", title: ps.disc3Title, desc: ps.disc3Desc },
  ];

  return (
    <div className="glass w-full max-w-[1040px] mx-auto rounded-[28px] overflow-hidden transition-all duration-300 max-md:bg-transparent max-md:border-0 max-md:shadow-none max-md:rounded-none max-md:overflow-visible max-md:backdrop-blur-none">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.05fr] md:min-h-[600px] gap-3.5 md:gap-0">
        {/* =================================================================== */}
        {/* LEFT: Munshi ji's ink story — on phones it compresses to a strip (M2) */}
        {/* =================================================================== */}
        <div className="ink-surface rounded-[24px] md:rounded-none p-4 md:p-9 flex flex-col justify-between relative overflow-hidden text-on-ink">
          <div className="absolute -top-[200px] -right-[180px] size-[420px] rounded-full opacity-55 blur-[2px] pointer-events-none" style={{ background: "radial-gradient(circle at 35% 30%, #FFE3C9, #FF7A1A 60%, transparent 72%)" }} aria-hidden="true" />

          <div className="relative flex flex-col gap-[18px]">
            <span className="hidden md:inline-flex self-start items-center gap-1.5 rounded-full bg-amber-bg px-[11px] py-1 text-[12px] font-bold text-amber-ink">
              {ps.sovereignPortal}
            </span>
            <div className="flex items-center gap-3 md:items-start md:flex-col md:gap-2">
              <span className="md:hidden shrink-0"><Munshi size={56} state="welcome" /></span>
              <div className="text-start">
                <h1 className="text-[17px] md:text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05]">{ps.munshiIntroTitle}</h1>
                <p className="text-soft text-[12.5px] md:text-[17px] font-semibold leading-snug md:mt-2">{ps.munshiIntroSub}</p>
              </div>
            </div>

            <div className="hidden md:block text-start">
              <h2 className="text-[12px] uppercase tracking-[.08em] text-soft font-bold">{ps.threeChecksTitle}</h2>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {checks.map((c) => (
                  <div key={c.title} className="flex items-start gap-3 rounded-[16px] bg-white/[0.08] border border-white/[0.14] px-3.5 py-3">
                    <span className={`mt-1.5 size-2.5 rounded-full shrink-0 ${c.dot}`} aria-hidden="true" />
                    <div>
                      <strong className="block text-sm font-bold">{c.title}</strong>
                      <p className="text-[12.5px] text-[#CDBDFF] leading-[1.45]">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block relative">
            <div className="mt-5 flex items-end justify-between">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold">
                <ShieldCheck size={16} className="text-ok shrink-0" />
                <span>{ps.vaultBadge}</span>
              </span>
              <Munshi size={72} state="welcome" />
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.14] pt-3.5">
              <span className="font-mono text-[11px] text-[#CDBDFF] tracking-[.02em]">{t.shell.independent}</span>
              <span className="inline-flex items-center rounded-full bg-amber-bg px-[11px] py-1 text-[12px] font-bold text-amber-ink">AY 2026-27</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT: the tabs and their views                                       */}
        {/* =================================================================== */}
        <div className="flex flex-col gap-[18px] px-0 pb-2 md:px-7 md:pt-7 md:pb-6 max-md:pb-28">
          {view === "citizen" || view === "ca" ? (
            <div className="flex gap-1 p-1 rounded-[16px] max-md:rounded-[14px] bg-white/50 dark:bg-white/[0.06] border border-glass-edge text-[13.5px] max-md:text-[13px] font-bold" role="tablist" aria-label={`${ps.citizenTab} · ${ps.caTab}`}>
              {(
                [
                  ["citizen", ps.citizenTab, UserRound],
                  ["ca", ps.caTab, Award],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={view === id}
                  onClick={() => setView(id)}
                  className={`flex-1 h-10 max-md:h-[38px] rounded-[12px] max-md:rounded-[11px] flex items-center justify-center gap-[7px] transition-colors cursor-pointer ${
                    view === id ? "ink-surface" : "text-ink-3 hover:text-ink"
                  }`}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : (
            backLink
          )}

          {/* ---- Citizen: PAN → sign-up link → OR → document row → quick demo PANs (1a/1b, m2a/m2b) ---- */}
          {view === "citizen" && (
            <form onSubmit={onPanSubmit} className="flex flex-col gap-[18px] animate-in fade-in text-start">
              <div>
                <h3 className="text-[22px] max-md:text-[19px] font-extrabold tracking-[-0.02em] text-ink">{ps.panOnlyLabel}</h3>
                <p className="mt-1 text-[13.5px] max-md:text-[13px] text-ink-2 leading-[1.55]">{ps.panOnlySub}</p>
              </div>
              <div>
                <label htmlFor="auth-pan-input" className={LABEL}>{ps.panInputLabel}</label>
                <input
                  id="auth-pan-input"
                  type="text"
                  value={panInput}
                  onChange={(e) => onPanChange(e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="DEMPS4417K"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${MONO_FIELD} ${panInputError ? FIELD_BAD : FIELD_OK}`}
                />
                {panInputError ? (
                  <p role="alert" className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-bad">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{panInputError}</span>
                  </p>
                ) : (
                  <p className="mt-2 font-mono text-[11px] text-ink-3 tracking-[.02em]">{ps.testOtpCode}</p>
                )}
              </div>
              <div className={PINNED}>
                <button type="submit" className={PRIMARY}>
                  <KeyRound size={16} aria-hidden="true" />
                  <span>{ps.signInBtn} →</span>
                </button>
              </div>
              <p className="text-center text-[13.5px] max-md:text-[13px] text-ink-2">
                {ps.newHere}{" "}
                <button type="button" onClick={() => setView("signup")} className="font-bold text-money underline underline-offset-[3px] cursor-pointer">
                  {ps.createAccountLink}
                </button>
              </p>
              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[11px] text-ink-3 tracking-[.02em]">{ps.orLabel}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <button
                type="button"
                onClick={() => setView("doc")}
                className="flex items-center gap-3 rounded-[16px] max-md:rounded-[14px] border-[1.5px] border-dashed border-ink-3 bg-white/55 dark:bg-white/[0.06] px-4 py-3.5 max-md:px-3.5 max-md:py-3 text-start transition hover:border-money cursor-pointer"
              >
                <span className="size-10 max-md:size-9 rounded-[12px] max-md:rounded-[11px] ink-surface flex items-center justify-center shrink-0">
                  <FileUp size={18} aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] max-md:text-[13.5px] font-bold text-ink">{ps.docRowTitle}</span>
                  <span className="block text-[12.5px] max-md:text-[12px] text-ink-3">{ps.docRowSub}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-money" aria-hidden="true" />
              </button>
              <div className="border-t border-line pt-3.5">
                <span className="block font-mono text-[10.5px] uppercase tracking-[.02em] text-ink-3">{ps.quickDemoPan}</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["sunita", "rakesh", "priya"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onPanChange(PERSONAS[id].pan)}
                      className="glass-flat inline-flex items-center rounded-full px-[11px] py-1 font-mono text-[12px] font-medium tracking-[.04em] text-ink-3 hover:border-money/60 hover:text-ink transition cursor-pointer"
                    >
                      {PERSONAS[id].name.split(" ")[0]} ({PERSONAS[id].pan})
                    </button>
                  ))}
                </div>
              </div>
              {footer}
            </form>
          )}

          {/* ---- Chartered Accountant: code + PIN + optional stamp (1c, m2c) ---- */}
          {view === "ca" && caSubView === "client_code" && (
            <form onSubmit={handleCaSubmit} className="flex flex-col gap-[18px] animate-in fade-in text-start">
              <div>
                <h3 className="text-[22px] max-md:text-[19px] font-extrabold tracking-[-0.02em] text-ink">{ps.caLoginTitle}</h3>
                <p className="mt-1 text-[13.5px] max-md:text-[13px] text-ink-2 leading-[1.55]">{ps.caLoginSub}</p>
              </div>
              <div>
                <label htmlFor="ca-code-input" className={LABEL}>{ps.caCodeLabel}</label>
                <input
                  id="ca-code-input"
                  type="text"
                  value={caCode}
                  onChange={(e) => {
                    setCaCode(e.target.value.toUpperCase());
                    setCaError(null);
                  }}
                  placeholder="CA-7842-91"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${MONO_FIELD} ${caError ? FIELD_BAD : FIELD_OK}`}
                />
              </div>
              <div>
                <label htmlFor="ca-pin-input" className={LABEL}>{ps.caPinLabel}</label>
                <input
                  id="ca-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={caPin}
                  onChange={(e) => {
                    setCaPin(e.target.value);
                    setCaError(null);
                  }}
                  placeholder="••••"
                  autoComplete="off"
                  className={`${MONO_FIELD} ${FIELD_OK}`}
                />
              </div>
              <div>
                <span className="block text-[12px] font-bold uppercase tracking-[.08em] text-ink-3">{ps.caStampLabel}</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={caName}
                    onChange={(e) => setCaName(e.target.value)}
                    placeholder={ps.caNamePlaceholder}
                    aria-label={ps.caStampLabel}
                    className={`${FIELD} ${FIELD_OK} h-[42px] px-4 text-[13.5px]`}
                  />
                  <input
                    type="text"
                    value={caMembership}
                    onChange={(e) => setCaMembership(e.target.value)}
                    placeholder={ps.caMembershipPlaceholder}
                    aria-label={ps.caMembershipPlaceholder}
                    className={`${FIELD} ${FIELD_OK} h-[42px] px-4 text-center font-mono text-[13.5px] font-semibold uppercase tracking-[.14em]`}
                  />
                </div>
              </div>
              {caError && (
                <p role="alert" className="flex items-center gap-2 rounded-[14px] bg-bad-soft px-3.5 py-3 text-[13px] font-semibold text-bad">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{caError}</span>
                </p>
              )}
              <div className={PINNED}>
                <button type="submit" disabled={caBusy} className={PRIMARY}>
                  {caBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                  <span>{caBusy ? ps.caVerifying : `${ps.caOpenBtn} →`}</span>
                </button>
              </div>
              <p className="text-center text-[13px] text-ink-3">
                {ps.caNoCode}{" "}
                <button type="button" onClick={() => void handleCaDemo()} disabled={caBusy} className="font-bold text-money hover:underline cursor-pointer disabled:opacity-60">
                  {ps.caDemoLink}
                </button>
              </p>

              {/* CA Account Login vs Registration Options */}
              <div className="pt-2 border-t border-glass-edge space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => setCaSubView("account_login")}
                  className="w-full text-[13px] font-bold text-money hover:underline cursor-pointer py-1"
                >
                  {ps.caAccountLoginOption}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCaRegisterOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-[12px] bg-paper-2 hover:bg-amber-bg border border-glass-edge hover:border-money/40 text-[12.5px] font-bold text-ink-2 hover:text-money transition cursor-pointer"
                >
                  <Award size={15} className="text-money shrink-0" />
                  <span>{ps.caRegisterOption}</span>
                </button>
              </div>

              {footer}
            </form>
          )}

          {/* ---- Registered CA: Account Login with ICAI/Email + Password ---- */}
          {view === "ca" && caSubView === "account_login" && (
            <form onSubmit={handleCaAccountLogin} className="flex flex-col gap-[18px] animate-in fade-in text-start">
              <div>
                <h3 className="text-[22px] max-md:text-[19px] font-extrabold tracking-[-0.02em] text-ink">{ps.caAccountLoginTitle}</h3>
                <p className="mt-1 text-[13.5px] max-md:text-[13px] text-ink-2 leading-[1.55]">{ps.caAccountLoginSub}</p>
              </div>

              <div>
                <label htmlFor="ca-login-id" className={LABEL}>ICAI Membership Number or Email</label>
                <input
                  id="ca-login-id"
                  type="text"
                  required
                  value={caLoginId}
                  onChange={(e) => {
                    setCaLoginId(e.target.value);
                    setCaAccountError(null);
                  }}
                  placeholder="e.g. 084920 or ca@firm.in"
                  autoCapitalize="none"
                  autoComplete="username"
                  className={`${MONO_FIELD} ${caAccountError ? FIELD_BAD : FIELD_OK}`}
                />
              </div>

              <div>
                <label htmlFor="ca-login-password" className={LABEL}>Account Password</label>
                <input
                  id="ca-login-password"
                  type="password"
                  required
                  value={caLoginPassword}
                  onChange={(e) => {
                    setCaLoginPassword(e.target.value);
                    setCaAccountError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${FIELD} ${FIELD_OK}`}
                />
              </div>

              {caAccountError && (
                <p role="alert" className="flex items-center gap-2 rounded-[14px] bg-bad-soft px-3.5 py-3 text-[13px] font-semibold text-bad">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{caAccountError}</span>
                </p>
              )}

              <div className={PINNED}>
                <button type="submit" disabled={caAccountBusy} className={PRIMARY}>
                  {caAccountBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                  <span>{caAccountBusy ? "Signing in…" : ps.caAccountLoginBtn}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-glass-edge flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={() => setCaSubView("client_code")}
                  className="font-bold text-ink-2 hover:text-ink cursor-pointer"
                >
                  {ps.caClientCodeOption}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCaRegisterOpen(true)}
                  className="font-bold text-money hover:underline cursor-pointer"
                >
                  Register as CA
                </button>
              </div>

              {footer}
            </form>
          )}

          {/* ---- CA Self-Registration Modal / View ---- */}
          {isCaRegisterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
              <div className="w-full max-w-md bg-paper rounded-[24px] border border-glass-edge shadow-2xl p-6 space-y-4 text-start animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-glass-edge">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-bg text-money border border-money/30">
                      <Award size={18} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-extrabold text-ink">{ps.caRegisterTitle}</h3>
                      <span className="text-[11px] font-mono text-money font-semibold uppercase tracking-wider">ICAI Network</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCaRegisterOpen(false);
                      setRegCaError(null);
                      setRegCaSuccess(false);
                    }}
                    className="text-ink-3 hover:text-ink text-sm p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-[12.5px] text-ink-2 leading-relaxed">
                  {ps.caRegisterSub}
                </p>

                {regCaError && (
                  <p role="alert" className="flex items-center gap-2 rounded-[14px] bg-bad-soft px-3.5 py-2.5 text-[12px] font-semibold text-bad">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{regCaError}</span>
                  </p>
                )}

                {regCaSuccess ? (
                  <div className="p-5 text-center bg-ok/10 border border-ok/30 rounded-2xl space-y-2">
                    <CheckCircle2 size={32} className="text-ok mx-auto" />
                    <h4 className="text-[14px] font-bold text-ink">{ps.caRegSuccess}</h4>
                    <p className="text-[12px] text-ink-2">Opening CA Portal workspace…</p>
                  </div>
                ) : (
                  <form onSubmit={handleCaRegisterSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1">{ps.caRegNameLabel} *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CA Rajesh Sharma"
                        value={regCaName}
                        onChange={(e) => setRegCaName(e.target.value)}
                        className="w-full h-[40px] px-3.5 rounded-[12px] bg-paper-2 border border-glass-edge text-[13px] text-ink outline-none focus:border-money"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1">{ps.caRegIcalLabel} *</label>
                      <input
                        type="text"
                        required
                        maxLength={7}
                        placeholder="e.g. 084920"
                        value={regCaMembership}
                        onChange={(e) => setRegCaMembership(e.target.value)}
                        className="w-full h-[40px] px-3.5 rounded-[12px] bg-paper-2 border border-glass-edge font-mono text-[13px] text-ink outline-none focus:border-money"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1">{ps.caRegPasswordLabel} *</label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        placeholder="••••••••"
                        value={regCaPassword}
                        onChange={(e) => setRegCaPassword(e.target.value)}
                        className="w-full h-[40px] px-3.5 rounded-[12px] bg-paper-2 border border-glass-edge text-[13px] text-ink outline-none focus:border-money"
                      />
                    </div>

                    {/* Optional Practice Details Toggle */}
                    <div className="pt-1">
                      <details className="text-xs group">
                        <summary className="text-[11.5px] font-bold text-ink-3 hover:text-ink cursor-pointer list-none flex items-center justify-between py-1">
                          <span>+ Add optional practice details (firm, city, email)</span>
                          <span className="text-[10px] text-money group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="pt-2 space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-0.5">{ps.caRegFirmLabel}</label>
                              <input
                                type="text"
                                placeholder="e.g. Sharma & Co."
                                value={regCaFirm}
                                onChange={(e) => setRegCaFirm(e.target.value)}
                                className="w-full h-[36px] px-3 rounded-[10px] bg-paper-2 border border-glass-edge text-[12px] text-ink outline-none focus:border-money"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-0.5">{ps.caRegCityLabel}</label>
                              <input
                                type="text"
                                placeholder="e.g. New Delhi"
                                value={regCaCity}
                                onChange={(e) => setRegCaCity(e.target.value)}
                                className="w-full h-[36px] px-3 rounded-[10px] bg-paper-2 border border-glass-edge text-[12px] text-ink outline-none focus:border-money"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-0.5">{ps.caRegEmailLabel}</label>
                            <input
                              type="email"
                              placeholder="ca@firm.in"
                              value={regCaEmail}
                              onChange={(e) => setRegCaEmail(e.target.value)}
                              className="w-full h-[36px] px-3 rounded-[10px] bg-paper-2 border border-glass-edge text-[12px] text-ink outline-none focus:border-money"
                            />
                          </div>
                        </div>
                      </details>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isRegisteringCa}
                        className="w-full h-[44px] flex items-center justify-center gap-2 rounded-[14px] bg-ink text-paper dark:bg-paper dark:text-ink hover:opacity-90 font-bold text-[13.5px] transition cursor-pointer shadow-md"
                      >
                        {isRegisteringCa ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                        <span>{ps.caRegSubmitBtn}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ---- Create account (1d–1f, m2d) ---- */}
          {view === "signup" && (
            <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-[18px] animate-in fade-in text-start">
              <div>
                <h3 className="text-[22px] max-md:text-[19px] font-extrabold tracking-[-0.02em] text-ink">{ps.signUpTitle}</h3>
                <p className="mt-1 text-[13.5px] max-md:text-[13px] text-ink-2 leading-[1.55]">{ps.signUpSub}</p>
              </div>
              {signUpError && (
                <p role="alert" className="flex items-center gap-2 rounded-[14px] bg-bad-soft px-3.5 py-3 text-[13px] font-semibold text-bad">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{signUpError}</span>
                </p>
              )}
              <div>
                <label htmlFor="signup-pan-input" className={LABEL}>{ps.panInputLabel}</label>
                <input
                  id="signup-pan-input"
                  type="text"
                  required
                  value={signUpPan}
                  onChange={(e) => {
                    setSignUpPan(e.target.value.toUpperCase());
                    setSignUpError(null);
                  }}
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${MONO_FIELD} ${signUpError ? FIELD_BAD : FIELD_OK}`}
                />
                <div className="mt-2.5 rounded-[14px] bg-white/55 dark:bg-white/[0.06] border border-glass-edge px-3.5 py-3 text-[12.5px] text-ink-2">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <Lock size={13} className="text-ok" aria-hidden="true" />
                    <span>{ps.instantVaultTitle}</span>
                  </div>
                  <p className="leading-relaxed">{ps.instantVaultDesc}</p>
                </div>
              </div>
              <div className={PINNED}>
                <button type="submit" disabled={isSubmittingSignUp} className={PRIMARY}>
                  {isSubmittingSignUp ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      <span>{ps.readingDoc}</span>
                    </>
                  ) : (
                    <>
                      <span>{ps.signUpBtnText}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
              {footer}
            </form>
          )}

          {/* ---- Sign in with a document (1g–1k, 1o; m2e/m2f) ---- */}
          {view === "doc" && (
            <div className="flex flex-col gap-[18px] animate-in fade-in text-start">
              <div>
                <h3 className="text-[22px] max-md:text-[19px] font-extrabold tracking-[-0.02em] text-ink">{ps.signInWithDocTitle}</h3>
                <p className="mt-1 text-[13.5px] max-md:text-[13px] text-ink-2 leading-[1.55]">{ps.signInWithDocSub}</p>
              </div>

              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragCounter.current += 1;
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "copy";
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragCounter.current -= 1;
                  if (dragCounter.current <= 0) {
                    dragCounter.current = 0;
                    setIsDragging(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragCounter.current = 0;
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void processDocument(file);
                }}
                className={`relative flex flex-col items-center justify-center gap-2.5 rounded-[22px] border-2 border-dashed p-[26px] text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-money bg-amber-bg shadow-[0_0_0_5px_rgba(255,122,26,.18)] scale-[1.01]"
                    : "border-ink-3 bg-white/45 dark:bg-white/[0.05] hover:border-money"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.json"
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  aria-label={ps.dropzoneTitle}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = "";
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void processDocument(file);
                  }}
                />
                <div className="pointer-events-none flex flex-col items-center gap-2.5">
                  <span className={`size-[50px] rounded-[16px] flex items-center justify-center text-white ${isDragging ? "bg-money" : "ink-surface"}`}>
                    {docPhase === "reading" ? <Loader2 size={22} className="animate-spin" aria-hidden="true" /> : <FileUp size={22} aria-hidden="true" />}
                  </span>
                  <p className="text-[14.5px] font-bold text-ink">{isDragging ? ps.docDropNow : ps.dropzoneTitle}</p>
                  <span className="font-mono text-[11px] text-ink-3 tracking-[.02em]">{ps.docFormats}</span>
                  <span className="inline-flex items-center rounded-full bg-ok-soft px-[11px] py-1 text-[12px] font-bold text-ok-ink">{ps.clientSideOnly}</span>
                </div>
              </div>

              {/* Evaluator / Judge Quick Sample PDFs */}
              <div className="rounded-[18px] bg-white/55 dark:bg-white/[0.06] border border-glass-edge p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-ink flex items-center gap-1.5">
                    <Sparkles size={13} className="text-money" />
                    <span>Try with Official Sample PDFs:</span>
                  </span>
                  <span className="text-[10px] font-mono text-money bg-amber-bg px-2 py-0.5 rounded-full font-semibold">1-Click Test</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleLoadSampleDoc("Form 16 - Anthony D'Souza.pdf")}
                    className="glass-flat flex items-center justify-between p-2.5 rounded-[12px] hover:border-money transition text-left group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block text-[12.5px] font-bold text-ink truncate group-hover:text-money">{localizeName("Anthony D'Souza", lang)}</span>
                      <span className="block text-[10.5px] text-ink-3">Form 16 (Salaried ₹12.5L)</span>
                    </div>
                    <span className="text-[11px] font-bold text-money shrink-0">Load ⚡</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleLoadSampleDoc("AIS _ TIS Statement - Anthony D'Souza.pdf")}
                    className="glass-flat flex items-center justify-between p-2.5 rounded-[12px] hover:border-money transition text-left group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block text-[12.5px] font-bold text-ink truncate group-hover:text-money">{localizeName("Anthony D'Souza", lang)}</span>
                      <span className="block text-[10.5px] text-ink-3">AIS / TIS (Interest ₹28.5K)</span>
                    </div>
                    <span className="text-[11px] font-bold text-money shrink-0">Load ⚡</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleLoadSampleDoc("Form 16 - Faheem Ahmed.pdf")}
                    className="glass-flat flex items-center justify-between p-2.5 rounded-[12px] hover:border-money transition text-left group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block text-[12.5px] font-bold text-ink truncate group-hover:text-money">{localizeName("Faheem Ahmed", lang)}</span>
                      <span className="block text-[10.5px] text-ink-3">Form 16 (Salaried ₹8.4L)</span>
                    </div>
                    <span className="text-[11px] font-bold text-money shrink-0">Load ⚡</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleLoadSampleDoc("AIS _ TIS Statement - Faheem Ahmed.pdf")}
                    className="glass-flat flex items-center justify-between p-2.5 rounded-[12px] hover:border-money transition text-left group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block text-[12.5px] font-bold text-ink truncate group-hover:text-money">{localizeName("Faheem Ahmed", lang)}</span>
                      <span className="block text-[10.5px] text-ink-3">AIS / TIS (Interest ₹18.4K)</span>
                    </div>
                    <span className="text-[11px] font-bold text-money shrink-0">Load ⚡</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-glass-edge text-[11px] text-ink-3 flex-wrap gap-1">
                  <span>Download PDFs for manual drag & drop:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href="/samples/Form 16 - Anthony D'Souza.pdf" download className="hover:text-money underline">Anthony Form 16</a>
                    <span>·</span>
                    <a href="/samples/AIS _ TIS Statement - Anthony D'Souza.pdf" download className="hover:text-money underline">Anthony AIS</a>
                    <span>·</span>
                    <a href="/samples/Form 16 - Faheem Ahmed.pdf" download className="hover:text-money underline">Faheem Form 16</a>
                    <span>·</span>
                    <a href="/samples/AIS _ TIS Statement - Faheem Ahmed.pdf" download className="hover:text-money underline">Faheem AIS</a>
                  </div>
                </div>
              </div>

              {docStatusMsg && (
                <div
                  role="status"
                  className={`flex items-start gap-2.5 rounded-[14px] px-3.5 py-3 text-[13px] ${
                    docPhase === "error"
                      ? "bg-bad-soft text-bad font-semibold"
                      : docPhase === "success"
                        ? "bg-ok-soft text-ok-ink"
                        : "glass-flat text-ink"
                  }`}
                >
                  {docPhase === "reading" && <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" aria-hidden="true" />}
                  {docPhase === "success" && <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />}
                  {docPhase === "error" && <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
                  {docPhase === "manual_pan" && <HelpCircle size={16} className="mt-0.5 shrink-0 text-tertiary" aria-hidden="true" />}
                  <span>{docPhase === "manual_pan" ? ps.noPanFound : docStatusMsg}</span>
                </div>
              )}

              {docPhase === "manual_pan" && (
                <form onSubmit={handleManualPanForDocSubmit} className="animate-in fade-in">
                  <label htmlFor="doc-pan-input" className={LABEL}>{ps.panInputLabel}</label>
                  <div className="flex gap-2">
                    <input
                      id="doc-pan-input"
                      type="text"
                      required
                      value={manualPanForDoc}
                      onChange={(e) => setManualPanForDoc(e.target.value.toUpperCase())}
                      maxLength={10}
                      placeholder="DEMPS9052M"
                      autoCapitalize="characters"
                      className={`${FIELD} ${FIELD_OK} h-[46px] flex-1 px-4 text-center font-mono text-[16px] font-semibold uppercase tracking-[.14em]`}
                    />
                    <button type="submit" className="ink-surface h-[46px] rounded-[14px] px-5 text-[14.5px] font-bold hover:opacity-90 transition cursor-pointer">
                      {ps.signInBtn}
                    </button>
                  </div>
                </form>
              )}
              {footer}
            </div>
          )}

          {/* ---- Demo citizens (1p) — reached from the landing's "Try a demo citizen" ---- */}
          {view === "personas" && (
            <div className="flex flex-col gap-[18px] animate-in fade-in text-start">
              <div>
                <h3 className="text-[22px] max-md:text-[19px] font-extrabold tracking-[-0.02em] text-ink">{ps.demoTitle}</h3>
                <p className="mt-1 text-[13.5px] max-md:text-[13px] text-ink-2 leading-[1.55]">{ps.demoSub}</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {(["sunita", "rakesh", "priya"] as const).map((id) => {
                  const person = PERSONAS[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onPanChange(person.pan);
                        if (onLaunchPersona) onLaunchPersona(id, true);
                      }}
                      className="group flex w-full items-center gap-3.5 rounded-[18px] bg-white/55 dark:bg-white/[0.06] border border-glass-edge px-4 py-3.5 text-start transition hover:border-money cursor-pointer"
                    >
                      <span className="size-10 shrink-0 rounded-full bg-amber-bg text-amber-ink flex items-center justify-center text-[12px] font-extrabold" aria-hidden="true">
                        {person.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2 flex-wrap font-bold text-ink">
                          {localizeName(person.name, lang)}
                          <span className="glass-flat inline-flex rounded-full px-[11px] py-1 font-mono text-[12px] font-medium tracking-[.04em] text-ink-3">{person.pan}</span>
                        </span>
                        <span className="block text-[12.5px] text-ink-3">{t.personas[id].phase} · {t.personas[id].action}</span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-ink-3 transition group-hover:translate-x-1 group-hover:text-money" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
