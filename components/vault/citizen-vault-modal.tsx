"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  X,
  CreditCard,
  FileText,
  Building2,
  Database,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Download,
  ExternalLink,
  QrCode,
  Sparkles,
} from "lucide-react";
import type { CitizenVaultUser } from "@/lib/vault/vault-store";
import { syncVaultUser, createVaultUserFromPan } from "@/lib/vault/vault-store";
import { formatMoney } from "@/lib/money";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";
import type { Lang } from "@/lib/types";

interface CitizenVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultUser: CitizenVaultUser | null;
  onUpdateUser?: (updated: CitizenVaultUser) => void;
  lang?: string;
}

export default function CitizenVaultModal({
  isOpen,
  onClose,
  vaultUser: propVaultUser,
  onUpdateUser,
  lang = "en",
}: CitizenVaultModalProps) {
  const [activeTab, setActiveTab] = useState<"kyc" | "tax_assets" | "documents" | "database">("kyc");
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const vaultUser = propVaultUser || createVaultUserFromPan("DEMPS4417K");
  const safeLang = (lang?.toLowerCase() || "en") as Lang;
  const ps = getPortalStrings(safeLang);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleForceSync = async () => {
    setSyncing(true);
    setSyncSuccess(null);
    try {
      const res = await syncVaultUser(vaultUser);
      if (res.ok) {
        setSyncSuccess(
          res.syncedToPostgres
            ? ps.vaultSyncedCloud
            : ps.vaultSyncedLocal
        );
        if (onUpdateUser) {
          onUpdateUser({
            ...vaultUser,
            syncedToPostgres: res.syncedToPostgres,
            dbStatus: res.dbStatus,
            lastSyncedAt: new Date().toISOString(),
          });
        }
      }
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncSuccess(null), 4000);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vaultUser, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wapsi_vault_${vaultUser.pan}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const maskedAadhaar = vaultUser.aadhaar
    ? showAadhaar
      ? vaultUser.aadhaar
      : `•••• •••• ${vaultUser.aadhaar.replace(/\s+/g, "").slice(-4)}`
    : ps.aadhaarPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-paper border border-line shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-modal-title"
      >
        {/* Header with Security Gradient */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-line bg-gradient-to-r from-navy via-navy-dark to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <ShieldCheck size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="vault-modal-title" className="font-sans text-lg sm:text-xl font-bold tracking-tight">
                  {ps.taxVault}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-300">
                  <Lock size={10} />
                  <span>AY 2026-27 SECURED</span>
                </span>
              </div>
              <p className="text-xs text-paper/70 font-mono">
                {vaultUser.fullName} · PAN: {vaultUser.pan}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                vaultUser.syncedToPostgres
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-300"
              }`}
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {vaultUser.syncedToPostgres ? "Sovereign Cloud Sync" : "Local Vault"}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-line bg-paper-2 px-4 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "kyc"
                ? "border-money text-money font-bold"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <CreditCard size={14} />
            <span>{ps.vaultKycTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tax_assets")}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "tax_assets"
                ? "border-money text-money font-bold"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Building2 size={14} />
            <span>{ps.vaultBankTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "documents"
                ? "border-money text-money font-bold"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <FileText size={14} />
            <span>
              {ps.vaultDocsTab} ({vaultUser.documents?.length || 0})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("database")}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "database"
                ? "border-money text-money font-bold"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Database size={14} />
            <span>{ps.vaultCloudTab}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {syncSuccess && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">{syncSuccess}</span>
              </div>
            </div>
          )}

          {/* TAB 1: KYC / Identity Cards */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
              {/* Virtual PAN Card */}
              <div className="relative rounded-2xl border-2 border-sky-400/30 bg-gradient-to-br from-slate-900 via-sky-950 to-navy-dark text-white p-5 sm:p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <ShieldCheck size={160} />
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-sky-300 block">
                      INCOME TAX DEPARTMENT · GOVT OF INDIA
                    </span>
                    <h3 className="font-sans text-sm font-bold text-slate-200">
                      PERMANENT ACCOUNT NUMBER CARD
                    </h3>
                  </div>
                  <div className="size-8 rounded-lg bg-amber-400/30 border border-amber-300/40 flex items-center justify-center">
                    <span className="size-4 rounded-sm bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm" />
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                      Name / नाम
                    </span>
                    <p className="font-sans text-lg font-bold text-white tracking-wide">
                      {vaultUser.fullName.toUpperCase()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                        Date of Birth / जन्म तिथि
                      </span>
                      <p className="font-mono text-sm font-semibold text-slate-200">
                        {vaultUser.dateOfBirth || "12/04/1988"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                        PAN / पैन
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-amber-300 tracking-wider">
                          {vaultUser.pan}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(vaultUser.pan, "pan")}
                          className="text-slate-400 hover:text-white transition"
                          title="Copy PAN"
                        >
                          {copiedField === "pan" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-sky-800/40 flex items-center justify-between text-[11px] font-mono text-sky-300/80">
                  <span>STATUS: CBDT VERIFIED</span>
                  <span>AY 2026-27 COMPLIANT</span>
                </div>
              </div>

              {/* Virtual Aadhaar Card */}
              <div className="relative rounded-2xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50/90 via-paper to-emerald-50/90 dark:from-slate-900 dark:via-paper-2 dark:to-emerald-950/40 p-5 sm:p-6 shadow-md">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-orange-500" />
                    <span className="size-3 rounded-full bg-white border border-slate-300" />
                    <span className="size-3 rounded-full bg-emerald-600" />
                    <span className="font-mono text-xs font-bold text-ink">
                      UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI)
                    </span>
                  </div>
                  <span className="stamp-chip text-[10px]">AADHAAR · आधार</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-mono text-ink-3 uppercase">Citizen / नागरिक</span>
                      <h4 className="font-sans text-base font-bold text-ink">{vaultUser.fullName}</h4>
                      <p className="text-xs text-ink-2 font-mono">{vaultUser.address || "New Delhi, Delhi, India"}</p>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-mono text-ink-3 uppercase block">Aadhaar Number</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xl font-bold tracking-widest text-ink">
                          {maskedAadhaar}
                        </span>
                        {vaultUser.aadhaar && (
                          <button
                            type="button"
                            onClick={() => setShowAadhaar(!showAadhaar)}
                            className="p-1 rounded text-ink-2 hover:text-ink transition cursor-pointer"
                            title={showAadhaar ? "Hide Aadhaar" : "Show Aadhaar"}
                          >
                            {showAadhaar ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                        {vaultUser.aadhaar && (
                          <button
                            type="button"
                            onClick={() => handleCopy(vaultUser.aadhaar || "", "aadhaar")}
                            className="p-1 rounded text-ink-2 hover:text-ink transition cursor-pointer"
                            title="Copy Aadhaar"
                          >
                            {copiedField === "aadhaar" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="size-20 rounded-xl border border-line bg-paper-2 flex flex-col items-center justify-center p-2 shrink-0">
                    <QrCode size={48} className="text-ink" />
                    <span className="text-[8px] font-mono text-ink-3 mt-1">VERIFIED</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Aadhaar-PAN Linkage Confirmed</span>
                  </span>
                  <span className="font-mono text-[11px] text-ink-3">Section 139AA</span>
                </div>
              </div>

              {/* Contact Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="surface-panel p-4 rounded-xl border border-line text-start space-y-1">
                  <span className="text-[11px] font-mono text-ink-3 uppercase">Registered Mobile (+91)</span>
                  <p className="font-mono text-sm font-bold text-ink">{vaultUser.mobile || "+91 98765 43210"}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} /> OTP Verified
                  </span>
                </div>

                <div className="surface-panel p-4 rounded-xl border border-line text-start space-y-1">
                  <span className="text-[11px] font-mono text-ink-3 uppercase">E-Filing Email Address</span>
                  <p className="font-mono text-sm font-bold text-ink truncate">{vaultUser.email || "citizen@taxpayer.gov.in"}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} /> Primary Notice Channel
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Bank & Tax Credits */}
          {activeTab === "tax_assets" && (
            <div className="space-y-5">
              <div>
                <h4 className="font-sans text-sm font-bold text-ink mb-2">
                  {ps.validatedBanksTitle}
                </h4>
                <div className="space-y-2.5">
                  {vaultUser.banks && vaultUser.banks.length > 0 ? (
                    vaultUser.banks.map((b, idx) => (
                      <div
                        key={idx}
                        className="surface-panel p-4 rounded-xl border border-line flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-ink">{b.bank}</span>
                            {b.nominatedForRefund && (
                              <span className="rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                                PRIMARY REFUND ACCOUNT
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-ink-2">
                            A/C: <strong className="text-ink">{b.maskedNumber}</strong> · IFSC:{" "}
                            <strong className="text-ink">{b.ifsc}</strong>
                          </p>
                        </div>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Pre-validated
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-ink-3 italic">No banks linked yet.</p>
                  )}
                </div>
              </div>

              {/* Tax Assets Snapshot */}
              <div className="surface-panel p-4 rounded-xl border border-line space-y-3">
                <h4 className="font-sans text-sm font-bold text-ink">
                  {ps.taxAssetsSummaryTitle}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="bg-paper-2 p-3 rounded-lg border border-line">
                    <span className="text-[10px] text-ink-3 block">TDS CREDITS (26AS)</span>
                    <span className="font-bold text-sm text-ink tabular">
                      ₹{formatMoney(vaultUser.stats?.tdsPaid || 124800)}
                    </span>
                  </div>
                  <div className="bg-paper-2 p-3 rounded-lg border border-line">
                    <span className="text-[10px] text-ink-3 block">ADVANCE TAX PAID</span>
                    <span className="font-bold text-sm text-ink tabular">
                      ₹{formatMoney(vaultUser.stats?.advanceTaxPaid || 0)}
                    </span>
                  </div>
                  <div className="bg-paper-2 p-3 rounded-lg border border-line">
                    <span className="text-[10px] text-money block font-sans font-bold">ESTIMATED REFUND</span>
                    <span className="font-bold text-base text-money tabular">
                      ₹{formatMoney(vaultUser.stats?.refundDue || 31170)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Stored Documents */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-2 font-mono">
                  {ps.docSignInDesc}
                </p>
                <span className="stamp-chip text-[10px]">{vaultUser.documents?.length || 0} FILES STORED</span>
              </div>

              <div className="space-y-2.5">
                {vaultUser.documents && vaultUser.documents.length > 0 ? (
                  vaultUser.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="surface-panel p-3.5 rounded-xl border border-line flex items-center justify-between gap-3 hover:border-money/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-navy/10 dark:bg-navy/30 text-navy dark:text-sky-300 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h5 className="font-sans text-xs font-bold text-ink">{doc.title}</h5>
                          <p className="font-mono text-[11px] text-ink-3">
                            {doc.issuer} · {doc.uploadedAt} · {doc.sizeKb} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300">
                          {doc.status.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => alert(`Viewing ${doc.title}`)}
                          className="p-1.5 text-ink-2 hover:text-ink transition cursor-pointer"
                          title="Open Document"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-ink-3 italic">No stored documents found.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Database & Sync */}
          {activeTab === "database" && (
            <div className="space-y-4">
              <div className="surface-panel p-4 rounded-xl border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-money" />
                    <h4 className="font-sans text-sm font-bold text-ink">Sovereign Encrypted Cloud Vault</h4>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      vaultUser.syncedToPostgres
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {vaultUser.syncedToPostgres ? "Active (Sovereign Cloud)" : "Local Storage Secured"}
                  </span>
                </div>

                <p className="text-xs text-ink-2 leading-relaxed">
                  Taxpayer credentials, verified identity cards, and return drafts are encrypted using AES-256 zero-knowledge encryption and persisted to your secure sovereign cloud vault.
                </p>

                <div className="bg-paper-3 p-3 rounded-lg border border-line font-mono text-[11px] space-y-1 text-ink-2">
                  <div>Storage Engine: <strong className="text-ink">AES-256 Sovereign Encrypted Vault</strong></div>
                  <div>Citizen Record: <strong className="text-ink">{vaultUser.id}</strong></div>
                  <div>Permanent Account Number: <strong className="text-ink">PAN ({vaultUser.pan})</strong></div>
                  <div>Last Synchronized: <strong className="text-ink">{vaultUser.lastSyncedAt || "Just now"}</strong></div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleForceSync}
                    disabled={syncing}
                    className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition cursor-pointer"
                  >
                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                    <span>{syncing ? "Connecting to Encrypted Vault..." : "Sync to Cloud Vault"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink hover:bg-paper-2 transition cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Export Vault Archive (JSON)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line bg-paper-2 flex items-center justify-between text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span>Encrypted with bank-grade security standards</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-paper border border-line hover:bg-paper-3 text-ink font-semibold transition cursor-pointer"
          >
            {ps.closeVaultBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
