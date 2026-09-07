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
} from "lucide-react";
import type { CitizenVaultUser, VaultDocument } from "@/lib/vault/vault-store";
import { syncVaultUser, createVaultUserFromPan } from "@/lib/vault/vault-store";
import VaultDocumentPreview from "./vault-document-preview";
import { formatMoney } from "@/lib/money";
import { MunshiAvatar } from "@/components/brand/munshi";
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
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[rgba(27,17,64,.55)] backdrop-blur-sm animate-in fade-in duration-200 max-md:items-end max-md:p-0">
      <div
        className="sheet-m relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[22px] bg-paper shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-modal-title"
      >
        {/* Header with Security Gradient */}
        <div className="relative px-[22px] py-4 bg-gradient-to-r from-ink-surface to-[#3A2A6E] text-on-ink flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[12px] bg-soft/20 border border-soft/35 flex items-center justify-center text-soft">
              <MunshiAvatar size={38} state={syncing ? "working" : "secure"} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="vault-modal-title" className="text-[17px] font-extrabold">
                  {ps.taxVault}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-[11px] py-1 text-[12px] font-bold text-ok-ink">
                  <Lock size={10} />
                  <span>AY 2026-27 SECURED</span>
                </span>
              </div>
              <p className="text-[11.5px] text-[#CDBDFF] font-mono tracking-[.02em]">
                {vaultUser.fullName} · PAN: {vaultUser.pan}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-[5px] rounded-full text-[11px] font-mono border ${
                vaultUser.syncedToPostgres
                  ? "bg-[rgba(94,230,176,.12)] border-[rgba(94,230,176,.3)] text-[#5EE6B0]"
                  : "bg-white/10 border-white/15 text-on-ink/80"
              }`}
            >
              <span className={`size-[7px] rounded-full ${vaultUser.syncedToPostgres ? "bg-[#5EE6B0]" : "bg-on-ink/60"}`} />
              <span>
                {vaultUser.syncedToPostgres ? "Sovereign Cloud Sync" : "Local Vault"}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-[10px] bg-white/10 hover:bg-white/20 text-on-ink/80 hover:text-on-ink flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex border-b border-line bg-white/40 dark:bg-white/[0.04] px-4 gap-1.5 overflow-x-auto scrollbar-none text-[12.5px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`flex items-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 border-b-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs ${
 activeTab === "kyc"
                ? "border-money text-money font-bold"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <CreditCard size={14} />
            <span>{ps.vaultKycTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tax_assets")}
            className={`flex items-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 border-b-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs ${
 activeTab === "tax_assets"
                ? "border-money text-money font-bold"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <Building2 size={14} />
            <span>{ps.vaultBankTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 border-b-2 transition whitespace-nowrap cursor-pointer text-[11px] sm:text-xs ${
 activeTab === "documents"
                ? "border-money text-money font-bold"
                : "border-transparent text-ink-3 hover:text-ink"
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
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <Database size={14} />
            <span>{ps.vaultCloudTab}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-[22px] space-y-[18px]">
          {syncSuccess && (
            <div className="rounded-[14px] bg-ok-soft p-3.5 text-[12.5px] text-ok-ink flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-ok-ink shrink-0" />
                <span className="font-semibold">{syncSuccess}</span>
              </div>
            </div>
          )}

          {/* TAB 1: KYC / Identity Cards */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
              {/* Virtual PAN Card */}
              <div className="relative rounded-[20px] border-2 border-[rgba(139,108,240,.35)] bg-[linear-gradient(135deg,#1B1140,#2A1B4A_55%,#3B2B7A)] text-white px-6 py-[22px] overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <ShieldCheck size={160} />
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-[.02em] text-[#CDBDFF] block">
                      INCOME TAX DEPARTMENT · GOVT OF INDIA
                    </span>
                    <h3 className="text-[13px] font-bold text-[#E9E1FF] mt-0.5">
                      PERMANENT ACCOUNT NUMBER CARD
                    </h3>
                  </div>
                  <div className="size-8 rounded-[9px] bg-soft/30 border border-soft/40 flex items-center justify-center">
                    <span className="size-4 rounded-[3px] bg-[linear-gradient(135deg,#FFE3C9,#FF7A1A)]" />
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <div>
                    <span className="text-[10px] text-[#9A8CC7] tracking-[.02em] block font-mono">
                      Name / नाम
                    </span>
                    <p className="text-[19px] font-extrabold text-white tracking-[.04em]">
                      {vaultUser.fullName.toUpperCase()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-[#9A8CC7] tracking-[.02em] block font-mono">
                        Date of Birth / जन्म तिथि
                      </span>
                      <p className="font-mono text-sm font-semibold text-[#E9E1FF]">
                        {vaultUser.dateOfBirth || "12/04/1988"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9A8CC7] tracking-[.02em] block font-mono">
                        PAN / पैन
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[17px] font-bold text-soft tracking-[.1em]">
                          {vaultUser.pan}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(vaultUser.pan, "pan")}
                          className="text-[#CDBDFF] hover:text-white transition cursor-pointer"
                          title="Copy PAN"
                        >
                          {copiedField === "pan" ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[rgba(139,108,240,.35)] flex items-center justify-between text-[10.5px] font-mono text-[#CDBDFF]">
                  <span>STATUS: CBDT VERIFIED</span>
                  <span>AY 2026-27 COMPLIANT</span>
                </div>
              </div>

              {/* Virtual Aadhaar Card */}
              <div className="relative rounded-[20px] border-2 border-[rgba(255,153,51,.5)] bg-[linear-gradient(135deg,rgba(255,153,51,.30),rgba(255,255,255,.85)_50%,rgba(19,136,8,.22))] dark:bg-[linear-gradient(135deg,rgba(255,153,51,.22),rgba(255,255,255,.06)_50%,rgba(19,136,8,.18))] px-[22px] py-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className="size-[11px] rounded-full bg-[#FF9933]" />
                    <span className="size-[11px] rounded-full bg-white border border-[#bbb]" />
                    <span className="size-[11px] rounded-full bg-[#138808]" />
                    <span className="font-mono text-[11px] text-ink tracking-[.02em]">
                      UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI)
                    </span>
                  </div>
                  <span className="inline-flex items-center px-[11px] py-1 rounded-full bg-white/60 dark:bg-white/10 border border-glass-edge font-mono text-[11px] text-ink-3 tracking-[.04em]">AADHAAR · आधार</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-mono text-ink-3 uppercase">Citizen / नागरिक</span>
                      <h4 className="text-[16px] font-extrabold text-ink">{vaultUser.fullName}</h4>
                      <p className="text-[11.5px] text-ink-2 font-mono tracking-[.02em]">{vaultUser.address || "New Delhi, Delhi, India"}</p>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-mono text-ink-3 uppercase block">Aadhaar Number</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[20px] font-bold tracking-[.14em] text-ink">
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
                            {copiedField === "aadhaar" ? <Check size={16} className="text-ok-ink" /> : <Copy size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="size-20 rounded-[12px] border border-glass-edge bg-white/80 dark:bg-white/10 flex flex-col items-center justify-center p-2 shrink-0">
                    <QrCode size={48} className="text-ink" />
                    <span className="text-[8px] font-mono text-ink-3 mt-1">VERIFIED</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-[12.5px] text-ok font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Aadhaar-PAN Linkage Confirmed</span>
                  </span>
                  <span className="font-mono text-[11px] text-ink-3">Section 139AA</span>
                </div>
              </div>

              {/* Contact Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-flat px-[18px] py-4 rounded-[16px] text-start space-y-1">
                  <span className="text-[10.5px] font-mono text-ink-3 tracking-[.02em]">Registered Mobile (+91)</span>
                  <p className="font-mono text-sm font-bold text-ink">{vaultUser.mobile || "+91 98765 43210"}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok">
                    <CheckCircle2 size={12} /> OTP Verified
                  </span>
                </div>

                <div className="glass-flat px-[18px] py-4 rounded-[16px] text-start space-y-1">
                  <span className="text-[10.5px] font-mono text-ink-3 tracking-[.02em]">E-Filing Email Address</span>
                  <p className="font-mono text-sm font-bold text-ink truncate">{vaultUser.email || "citizen@taxpayer.gov.in"}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok">
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
                        className="glass-flat px-[18px] py-4 rounded-[16px] flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-ink">{b.bank}</span>
                            {b.nominatedForRefund && (
                              <span className="rounded-full bg-ok-soft text-ok-ink text-[12px] font-bold px-[11px] py-1">
                                PRIMARY REFUND ACCOUNT
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-ink-2">
                            A/C: <strong className="text-ink">{b.maskedNumber}</strong> · IFSC:{" "}
                            <strong className="text-ink">{b.ifsc}</strong>
                          </p>
                        </div>
                        <span className="text-[12.5px] text-ok font-bold flex items-center gap-1">
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
              <div className="glass-flat px-[18px] py-4 rounded-[16px] space-y-3">
                <h4 className="font-sans text-sm font-bold text-ink">
                  {ps.taxAssetsSummaryTitle}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="bg-white/70 dark:bg-white/[0.06] p-3 rounded-[12px] border border-glass-edge">
                    <span className="text-[10px] text-ink-3 block">TDS CREDITS (26AS)</span>
                    <span className="font-sans font-extrabold text-[18px] tracking-[-.03em] text-ink tabular-nums">
                      {formatMoney(vaultUser.stats?.tdsPaid || 124800)}
                    </span>
                  </div>
                  <div className="bg-white/70 dark:bg-white/[0.06] p-3 rounded-[12px] border border-glass-edge">
                    <span className="text-[10px] text-ink-3 block">ADVANCE TAX PAID</span>
                    <span className="font-sans font-extrabold text-[18px] tracking-[-.03em] text-ink tabular-nums">
                      {formatMoney(vaultUser.stats?.advanceTaxPaid || 0)}
                    </span>
                  </div>
                  <div className="bg-white/70 dark:bg-white/[0.06] p-3 rounded-[12px] border border-glass-edge">
                    <span className="text-[10px] text-ink-3 block font-mono tracking-[.02em]">ESTIMATED REFUND</span>
                    <span className="font-sans font-extrabold text-[18px] tracking-[-.03em] text-money tabular-nums">
                      {formatMoney(vaultUser.stats?.refundDue || 31170)}
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
                <p className="flex items-center gap-2 text-[12.5px] text-ink-2">
                  <MunshiAvatar size={24} />
                  <span>{ps.docSignInDesc}</span>
                </p>
                <span className="inline-flex items-center px-[11px] py-1 rounded-full bg-white/60 dark:bg-white/10 border border-glass-edge font-mono text-[11px] text-ink-3 tracking-[.04em]">{vaultUser.documents?.length || 0} FILES STORED</span>
              </div>

              <div className="space-y-2.5">
                {vaultUser.documents && vaultUser.documents.length > 0 ? (
                  vaultUser.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="glass-flat px-[18px] py-3.5 rounded-[16px] flex items-center justify-between gap-3 hover:border-money/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-[10px] ink-surface text-on-ink flex items-center justify-center shrink-0">
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
                        <span className="text-[11px] font-bold text-ok-ink bg-ok-soft px-2.5 py-0.5 rounded-full">
                          {doc.status.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
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
              <div className="glass-flat px-[18px] py-4 rounded-[16px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-money" />
                    <h4 className="font-sans text-sm font-bold text-ink">Sovereign Encrypted Cloud Vault</h4>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
 vaultUser.syncedToPostgres
 ? "bg-ok-soft  text-ok-ink "
                        : "bg-tertiary/15  text-tertiary "
                    }`}
                  >
                    {vaultUser.syncedToPostgres ? "Active (Sovereign Cloud)" : "Local Storage Secured"}
                  </span>
                </div>

                <p className="text-xs text-ink-2 leading-relaxed">
                  Taxpayer credentials, verified identity cards, and return drafts are encrypted using AES-256 zero-knowledge encryption and persisted to your secure sovereign cloud vault.
                </p>

                <div className="bg-white/70 dark:bg-white/[0.06] p-3 rounded-[12px] border border-glass-edge font-mono text-[11px] space-y-1 text-ink-2">
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
                    className="flex items-center gap-2 rounded-[14px] ink-surface px-4 h-10 text-[13px] font-bold text-on-ink hover:opacity-90 transition cursor-pointer"
                  >
                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                    <span>{syncing ? "Connecting to Encrypted Vault..." : "Sync to Cloud Vault"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-2 rounded-[14px] border border-glass-edge bg-white/60 dark:bg-white/10 px-4 h-10 text-[13px] font-semibold text-ink hover:border-money/50 transition cursor-pointer"
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
        <div className="px-5 py-3 border-t border-line bg-white/40 dark:bg-white/[0.04] flex items-center justify-between text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <MunshiAvatar size={22} />
            <span>Encrypted with bank-grade security standards</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[14px] bg-white/60 dark:bg-white/10 border border-glass-edge hover:border-money/50 text-ink text-[13px] font-bold transition cursor-pointer"
          >
            {ps.closeVaultBtn}
          </button>
        </div>
      </div>

      <VaultDocumentPreview
        doc={previewDoc}
        vaultUser={vaultUser}
        lang={safeLang}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
