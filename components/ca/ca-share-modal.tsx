"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Copy,
  Check,
  Share2,
  Lock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Loader2,
  Clock,
  Award,
} from "lucide-react";
import type { Persona, Lang } from "@/lib/types";
import {
  createReviewRecord,
  fetchReviewRecord,
  type CAReviewRecord,
} from "@/lib/ca/ca-store";
import {
  listRegisteredCAs,
  requestCAReview,
  type RegisteredCA,
} from "@/lib/ca/ca-registry";
import { formatMoney } from "@/lib/money";
import { computeForPersona } from "@/lib/return/compute";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";

interface CAShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  regime: "new" | "old";
  lang?: Lang;
  onRecordCreated?: (record: CAReviewRecord) => void;
  onReviewReceived?: (record: CAReviewRecord) => void;
}

export default function CAShareModal({
  isOpen,
  onClose,
  persona,
  regime,
  lang = "en",
  onRecordCreated,
  onReviewReceived,
}: CAShareModalProps) {
  const ps = getPortalStrings(lang);
  const [tab, setTab] = useState<"own_ca" | "directory">("directory");
  const [step, setStep] = useState<"pin" | "share">("pin");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [record, setRecord] = useState<CAReviewRecord | null>(null);

  // Directory & Async draft state
  const [registeredCas, setRegisteredCas] = useState<RegisteredCA[]>([]);
  const [selectedCa, setSelectedCa] = useState<RegisteredCA | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [allowEdit, setAllowEdit] = useState(true);
  const [shareDocs, setShareDocs] = useState(true);
  const [clientNotes, setClientNotes] = useState("");
  const [draftSavedMsg, setDraftSavedMsg] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load registered CAs when modal opens
  useEffect(() => {
    if (isOpen) {
      const list = listRegisteredCAs();
      setRegisteredCas(list);
      if (list.length > 0 && !selectedCa) {
        setSelectedCa(list[0]);
      }
    }
  }, [isOpen, selectedCa]);

  // Compute baseline figure
  const b = computeForPersona(persona, regime);

  // Poll for CA review completion when in share mode
  useEffect(() => {
    if (!isOpen || !record || record.status === "reviewed") return;

    const interval = setInterval(async () => {
      try {
        const latest = await fetchReviewRecord(record.code);
        if (latest && latest.status === "reviewed") {
          setRecord(latest);
          if (onReviewReceived) {
            onReviewReceived(latest);
          }
        }
      } catch {
        // ignore
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, record, onReviewReceived]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      setPinError("Please enter a 4 to 6 digit security PIN");
      return;
    }
    if (cleanPin !== confirmPin.trim()) {
      setPinError("PIN confirmation does not match");
      return;
    }

    setPinError(null);
    setIsGenerating(true);

    try {
      if (tab === "directory" && selectedCa) {
        const rec = await requestCAReview({
          caId: selectedCa.id,
          citizenPan: persona.pan,
          citizenName: persona.name,
          assessmentYear: persona.assessmentYear || "2026-27",
          pin: cleanPin,
          originalPersona: persona,
          originalRegime: regime,
          permissions: {
            allowEdit,
            shareAIS: shareDocs,
            shareForm16: shareDocs,
          },
          clientNotes,
        });
        setRecord(rec);
        setDraftSavedMsg(`${ps.draftSavedSuccess} ${selectedCa.name}`);
        setStep("share");
        if (onRecordCreated) {
          onRecordCreated(rec);
        }
      } else {
        const rec = await createReviewRecord({
          pin: cleanPin,
          citizenPan: persona.pan,
          citizenName: persona.name,
          assessmentYear: persona.assessmentYear || "2026-27",
          originalPersona: persona,
          originalRegime: regime,
        });
        setRecord(rec);
        setStep("share");
        if (onRecordCreated) {
          onRecordCreated(rec);
        }
      }
    } catch (err) {
      setPinError("Could not generate share code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ca${record ? `?code=${encodeURIComponent(record.code)}` : ""}`
      : `/ca${record ? `?code=${record.code}` : ""}`;

  const copyToClipboard = (text: string, isLink = false) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isLink) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  };

  const shareText = record
    ? `Hi, I've prepared my Income Tax Return draft (AY 2026-27) on Wapsi. Please audit and verify my figures on the CA Portal:\n\nReview Link: ${portalUrl}\nAccess Code: ${record.code}\nSecurity PIN: (Provided separately for security)\n\nThank you!`
    : "";

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const filteredCas = registeredCas.filter((ca) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      ca.name.toLowerCase().includes(q) ||
      ca.city.toLowerCase().includes(q) ||
      ca.specialties.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-paper border border-line rounded-3xl shadow-glass overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-ink-surface px-6 py-4 text-on-ink shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-bg border border-money/40 text-money">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Review with Chartered Accountant</h3>
                <p className="text-xs text-money/80">
                  Peer-to-peer verification with verified tax professionals
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-on-ink/70 hover:text-on-ink transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab switcher: Listed Directory vs Personal CA */}
        {step === "pin" && (
          <div className="flex border-b border-glass-edge bg-paper-2 px-6 pt-2 shrink-0">
            <button
              type="button"
              onClick={() => setTab("directory")}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                tab === "directory"
                  ? "border-money text-money"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {ps.findCaTab}
            </button>
            <button
              type="button"
              onClick={() => setTab("own_ca")}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                tab === "own_ca"
                  ? "border-money text-money"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {ps.myCaTab}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {step === "pin" ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              {tab === "directory" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
                      Select Registered Chartered Accountant
                    </span>
                    <input
                      type="text"
                      placeholder="Search city / specialty..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="h-[30px] text-xs px-2.5 rounded-lg bg-paper-2 border border-line text-ink outline-none focus:border-money w-44"
                    />
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredCas.length === 0 ? (
                      <div className="p-6 text-center bg-paper-2 border border-dashed border-glass-edge rounded-2xl space-y-2">
                        <Award size={28} className="text-money mx-auto opacity-70" />
                        <h4 className="text-[13px] font-bold text-ink">No Registered CAs Listed Yet</h4>
                        <p className="text-[12px] text-ink-3 leading-relaxed max-w-sm mx-auto">
                          Independent Chartered Accountants can add themselves to the directory via the CA Portal registration. You can also invite your own CA using the &quot;{ps.myCaTab}&quot; option above.
                        </p>
                      </div>
                    ) : (
                      filteredCas.map((ca) => {
                        const isSelected = selectedCa?.id === ca.id;
                        return (
                          <div
                            key={ca.id}
                            onClick={() => setSelectedCa(ca)}
                            className={`p-3 rounded-2xl border transition cursor-pointer ${
                              isSelected
                                ? "bg-amber-bg border-money/60 shadow-xs"
                                : "bg-paper-2 border-line hover:border-money/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[13px] text-ink">{ca.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-ok/10 text-ok border border-ok/30">
                                  {ps.registeredCaBadge} #{ca.membershipNo}
                                </span>
                              </div>
                              <span className="text-[11.5px] font-bold text-money">★ {ca.rating}</span>
                            </div>
                            <p className="text-[11.5px] text-ink-2 mt-0.5">
                              {ca.firmName} • {ca.city} ({ca.experienceYears} {ps.caExperience})
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ca.specialties.map((spec) => (
                                <span key={spec} className="px-1.5 py-0.5 bg-paper rounded text-[10px] font-medium text-ink-3 border border-line">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Permissions & Draft options */}
                  <div className="p-3.5 bg-paper-2 border border-line rounded-2xl space-y-2 text-xs">
                    <span className="block font-bold text-ink text-[12px]">Client Access Permissions</span>
                    <label className="flex items-center gap-2 cursor-pointer text-ink-2">
                      <input
                        type="checkbox"
                        checked={allowEdit}
                        onChange={(e) => setAllowEdit(e.target.checked)}
                        className="rounded accent-money"
                      />
                      <span>{ps.allowEditPermission}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-ink-2">
                      <input
                        type="checkbox"
                        checked={shareDocs}
                        onChange={(e) => setShareDocs(e.target.checked)}
                        className="rounded accent-money"
                      />
                      <span>{ps.shareDocPermission}</span>
                    </label>

                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-ink-3 mb-1">{ps.clientNotesLabel}</label>
                      <input
                        type="text"
                        placeholder={ps.clientNotesPlaceholder}
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl bg-paper border border-line text-ink outline-none focus:border-money"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-bg border border-money/40 rounded-2xl p-4 text-xs text-ink-2 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-ink">
                    <Lock size={14} />
                    <span>Zero-Knowledge Taxpayer Privacy</span>
                  </div>
                  <p>
                    Set a secret 4 to 6 digit PIN. Only the person with both your <strong>Access Code</strong> and this <strong>PIN</strong> can inspect or modify your return figures.
                  </p>
                </div>
              )}

              {/* Tax Return Summary Pill */}
              <div className="flex items-center justify-between p-3 bg-paper-2 border border-line rounded-2xl text-xs">
                <div>
                  <span className="text-ink-3 block">Taxpayer</span>
                  <span className="font-bold text-ink">{persona.name} ({persona.pan})</span>
                </div>
                <div className="text-right">
                  <span className="text-ink-3 block">Draft Liability</span>
                  <span className={`font-mono font-bold ${b.refundOrDue >= 0 ? "text-money" : "text-alarm"}`}>
                    {b.refundOrDue >= 0 ? "Refund: " : "Due: "}
                    {formatMoney(Math.abs(b.refundOrDue), lang)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-ink">Set Access PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="e.g. 2468"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center tracking-widest text-lg font-mono font-bold p-2.5 bg-paper border border-line rounded-xl focus:ring-2 focus:ring-money/40 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-ink">Confirm PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Repeat PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full text-center tracking-widest text-lg font-mono font-bold p-2.5 bg-paper border border-line rounded-xl focus:ring-2 focus:ring-money/40 focus:outline-none"
                  />
                </div>
              </div>

              {pinError && (
                <p className="text-xs font-bold text-alarm bg-alarm/10 p-2.5 rounded-xl text-center">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                disabled={isGenerating || pin.length < 4 || (tab === "directory" && !selectedCa)}
                className="w-full py-3.5 px-4 ink-surface hover:ink-surface disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving draft & dispatching request…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{tab === "directory" ? ps.saveDraftAndRequest : "Generate CA Invitation Code"}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {draftSavedMsg && (
                <div className="p-3 bg-ok/10 border border-ok/30 rounded-2xl flex items-center gap-2 text-xs font-semibold text-ok">
                  <Check size={16} className="shrink-0" />
                  <span>{draftSavedMsg}</span>
                </div>
              )}

              {/* Generated Code Display */}
              <div className="text-center p-4 bg-gradient-to-b border-2 border-dashed border-money/40 rounded-2xl space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-money">
                  {selectedCa ? `Draft Assigned to ${selectedCa.name}` : "Your CA Access Code"}
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider text-ink select-all">
                    {record?.code}
                  </span>
                  <button
                    onClick={() => record && copyToClipboard(record.code)}
                    className="p-2 rounded-xl bg-paper hover:bg-paper-2 border border-line shadow-xs transition cursor-pointer text-ink"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check size={18} className="text-money" /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-ink-3">
                  Security PIN: <strong className="font-mono text-ink">{pin}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-ok hover:opacity-90 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>Share on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(portalUrl, true)}
                  className="flex items-center justify-center gap-2 p-3 bg-paper-2 hover:bg-paper-3 border border-line text-ink text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {copiedLink ? <Check size={16} className="text-money" /> : <ExternalLink size={16} />}
                  <span>{copiedLink ? "Link Copied!" : "Copy Portal Link"}</span>
                </button>
              </div>

              {/* Live Listening Status */}
              <div className="p-3.5 bg-paper-2 border border-line rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="size-2.5 rounded-full bg-money animate-ping" />
                  <div className="text-left">
                    <span className="font-bold text-ink block">Waiting for CA Audit</span>
                    <span className="text-ink-3 text-[11px]">
                      {record?.status === "reviewed"
                        ? "Review completed by CA! Ready to compare."
                        : "Your CA can now access and audit your draft at /ca"}
                    </span>
                  </div>
                </div>
                {record?.status === "reviewed" ? (
                  <button
                    onClick={() => {
                      if (onReviewReceived && record) onReviewReceived(record);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-money text-white font-bold rounded-lg text-xs shadow-xs hover:opacity-90"
                  >
                    View Diff →
                  </button>
                ) : (
                  <Clock size={16} className="text-ink-3" />
                )}
              </div>

              {/* Bottom dismissal */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 border border-line hover:bg-paper-2 text-ink text-xs font-semibold rounded-xl transition"
              >
                Close & Return to Filing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
