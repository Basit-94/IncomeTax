"use client";

/**
 * "Review with CA" (redesigned 2026-09-08). Two doors:
 *
 *  - **Get it verified by a Wapsi certified CA** — the return goes to every Chartered Accountant registered on
 *    Wapsi; the first to pick it up reviews it, comments on it, and sends a version back. No PIN, no code: the
 *    request is bound to the person's session and lands in the CA portal's inbox.
 *  - **I have my own CA** — exactly what existed before: a PIN, an access code, the portal link, WhatsApp.
 */

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, Check, Clock, Copy, ExternalLink, Loader2, Lock, MessageCircle, ShieldCheck, Users, X } from "lucide-react";
import type { Lang, Persona } from "@/lib/types";
import type { ReturnState } from "@/lib/return/state";
import { createReviewRecord, fetchReviewRecord, type CAReviewRecord } from "@/lib/ca/ca-store";
import { citizenReviews, reviewStatusLabel, type PublicReview } from "@/lib/ca/client";
import type { ReviewBackground } from "@/lib/ca/server-store";
import { ensureServerSession } from "@/lib/session-client";
import { loadSession } from "@/lib/auth-client";
import { formatMoney } from "@/lib/money";
import { computeForPersona } from "@/lib/return/compute";
import { Munshi } from "../brand/munshi";

interface CAShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  regime: "new" | "old";
  lang?: Lang;
  /** The year's intake, so the CA's background panel knows the situation (housing, extras, employer). */
  returnState?: ReturnState | null;
  onRecordCreated?: (record: CAReviewRecord) => void;
  onReviewReceived?: (record: CAReviewRecord) => void;
}

type Door = "choose" | "wapc" | "own";

/** What the CA reads first: who this is and what the year looked like — built from the return, never typed twice. */
export function backgroundFor(persona: Persona, regime: "new" | "old", state?: ReturnState | null, notes?: string): ReviewBackground {
  const intake = state?.yearIntake;
  const salary = persona.facts.filter((f) => f.kind === "salary").reduce((n, f) => n + f.amount, 0);
  const heads = [...new Set(persona.facts.map((f) => f.kind))];
  const employer = persona.facts.find((f) => f.kind === "salary")?.provenance.reporter;
  const b = computeForPersona(persona, regime);
  const situation = [
    `${persona.occupation || "Taxpayer"}${persona.city ? ` in ${persona.city}` : ""}, age ${persona.age}.`,
    salary ? `Salary ₹${salary.toLocaleString("en-IN")}${employer ? ` from ${employer}` : ""}.` : "No salary on record.",
    heads.length ? `Income heads: ${heads.join(", ")}.` : "",
    persona.claims.length ? `Deductions claimed: ${persona.claims.map((c) => `${c.section} ₹${c.amount.toLocaleString("en-IN")}${c.evidenceAttached ? "" : " (no proof)"}`).join(", ")}.` : "No Chapter VI-A claims yet.",
    `On the ${regime} regime the return shows ${b.refundOrDue >= 0 ? `a refund of ₹${b.refundOrDue.toLocaleString("en-IN")}` : `₹${(-b.refundOrDue).toLocaleString("en-IN")} due`}.`,
    intake?.answers.housing ? `Housing: ${intake.answers.housing}.` : "",
    intake?.answers.extras?.length ? `Anything else this year: ${intake.answers.extras.join(", ")}.` : "",
  ].filter(Boolean).join(" ");
  return {
    situation,
    notes: notes?.trim() || undefined,
    housing: intake?.answers.housing,
    extras: intake?.answers.extras,
    employer,
    employerCategory: intake?.read.salary?.category ?? intake?.answers.manual?.employerCategory,
    filed: !!state?.filedAt,
  };
}

export default function CAShareModal({ isOpen, onClose, persona, regime, lang = "en", returnState, onRecordCreated, onReviewReceived }: CAShareModalProps) {
  const [door, setDoor] = useState<Door>("choose");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<PublicReview | null>(null);
  const [registeredCount, setRegisteredCount] = useState<number | null>(null);

  // Own-CA door: unchanged mechanics.
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [record, setRecord] = useState<CAReviewRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const b = useMemo(() => computeForPersona(persona, regime), [persona, regime]);

  useEffect(() => {
    if (!isOpen) return;
    setDoor("choose");
    setError(null);
    setSent(null);
    setRecord(null);
    fetch("/api/ca/auth", { credentials: "same-origin" }).then((r) => r.json()).then((j: { registeredCount?: number }) => setRegisteredCount(j.registeredCount ?? 0)).catch(() => setRegisteredCount(null));
  }, [isOpen]);

  // Own-CA: poll for the CA's version, as before.
  useEffect(() => {
    if (!isOpen || !record || record.status === "reviewed") return;
    const t = setInterval(async () => {
      const latest = await fetchReviewRecord(record.code).catch(() => null);
      if (latest && latest.status === "reviewed") {
        setRecord(latest);
        onReviewReceived?.(latest);
      }
    }, 3500);
    return () => clearInterval(t);
  }, [isOpen, record, onReviewReceived]);

  if (!isOpen) return null;

  const sendToWapc = async () => {
    setBusy(true);
    setError(null);
    try {
      // The request is bound to the person's server session; the Manual page may only hold the client copy.
      const ensured = await ensureServerSession(loadSession());
      if (!ensured.ok) throw new Error("Sign in first so the request can be tied to your return.");
      const { review, registeredCount: n } = await citizenReviews.create({ mode: "wapc", regime, persona, background: backgroundFor(persona, regime, returnState, notes), clientNotes: notes, assessmentYear: persona.assessmentYear || "2026-27" });
      setRegisteredCount(n);
      setSent(review);
      onRecordCreated?.({ ...review, pinHash: "" } as CAReviewRecord);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the request. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const generateOwn = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pin.trim();
    if (clean.length < 4) return setError("Enter a 4 to 6 digit PIN.");
    if (clean !== confirmPin.trim()) return setError("The two PINs do not match.");
    setError(null);
    setBusy(true);
    try {
      const rec = await createReviewRecord({ pin: clean, citizenPan: persona.pan, citizenName: persona.name, assessmentYear: persona.assessmentYear || "2026-27", originalPersona: persona, originalRegime: regime });
      setRecord(rec);
      onRecordCreated?.(rec);
    } catch {
      setError("Could not generate the code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/ca${record ? `?code=${encodeURIComponent(record.code)}` : ""}` : "/ca";
  const shareText = record ? `Hi, I've prepared my Income Tax Return draft (AY 2026-27) on Wapsi. Please review it on the CA Portal:\n\nReview link: ${portalUrl}\nAccess code: ${record.code}\nSecurity PIN: (shared separately)\n\nThank you!` : "";
  const copy = (text: string, link = false) => {
    navigator.clipboard?.writeText(text);
    if (link) { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); } else { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Review with a Chartered Accountant">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-paper border border-line rounded-3xl shadow-glass overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative bg-ink-surface px-6 py-4 text-on-ink shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-bg border border-money/40 text-money"><ShieldCheck size={20} /></div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Review with a Chartered Accountant</h3>
              <p className="text-xs text-money/80">{door === "choose" ? "Pick how you want it looked at" : door === "wapc" ? "Wapsi certified CAs on Wapsi" : "Your own CA, by code and PIN"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-on-ink/70 hover:text-on-ink transition cursor-pointer" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* The return in one line */}
          <div className="flex items-center justify-between p-3 bg-paper-2 border border-line rounded-2xl text-xs">
            <div><span className="text-ink-3 block">Return</span><span className="font-bold text-ink">{persona.name} · AY {persona.assessmentYear || "2026-27"} · {regime} regime</span></div>
            <div className="text-right"><span className="text-ink-3 block">As it stands</span><span className={`font-mono font-bold ${b.refundOrDue >= 0 ? "text-money" : "text-alarm"}`}>{b.refundOrDue >= 0 ? "Refund " : "Due "}{formatMoney(Math.abs(b.refundOrDue), lang)}</span></div>
          </div>

          {door === "choose" && (
            <div className="grid gap-3">
              <button type="button" onClick={() => setDoor("wapc")} className="glass text-start rounded-2xl p-4 border-[1.5px] border-money/50 hover:border-money transition cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-bg text-money shrink-0"><Award size={20} /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-[15px] font-extrabold text-ink">Get it verified by a Wapsi certified CA</span><span className="px-2 py-0.5 rounded-full bg-ok-soft text-ok-ink text-[10px] font-bold uppercase tracking-wider">Recommended</span></div>
                    <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed">Your return goes to every Chartered Accountant registered and verified on Wapsi. The first to take it reviews every figure, leaves comments on the sections that need them, and sends back their version. You compare both and Munshi ji tells you which one holds up.</p>
                    <p className="text-[11px] text-ink-3 mt-1.5 flex items-center gap-1.5"><Users size={12} />{registeredCount === null ? "Checking who is on duty…" : registeredCount === 0 ? "No CA has registered yet — your request will wait in the inbox for the first one." : `${registeredCount} certified CA${registeredCount === 1 ? "" : "s"} registered`}</p>
                  </div>
                  <ArrowRight size={16} className="text-ink-3 shrink-0 mt-1" />
                </div>
              </button>
              <button type="button" onClick={() => setDoor("own")} className="glass text-start rounded-2xl p-4 border border-line hover:border-money/50 transition cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-paper-2 text-ink-2 shrink-0"><Lock size={20} /></div>
                  <div className="min-w-0">
                    <span className="text-[15px] font-extrabold text-ink">I have my own CA</span>
                    <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed">Set a PIN, get an access code and a portal link, send them on WhatsApp. Only the person with both the code and the PIN can open your return.</p>
                  </div>
                  <ArrowRight size={16} className="text-ink-3 shrink-0 mt-1" />
                </div>
              </button>
            </div>
          )}

          {door === "wapc" && !sent && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-bg border border-money/40 rounded-2xl text-xs text-ink-2 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-ink"><Award size={14} /><span>What the CA will see</span></div>
                <p>Your return as it stands, who you are and what this year looked like (from your papers and the answers you gave Munshi ji), and the note below. Never your Aadhaar or bank details.</p>
              </div>
              <label className="block">
                <span className="block text-xs font-bold text-ink mb-1">Anything the CA should know? (optional)</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. I changed jobs in October; not sure my HRA is right." className="w-full text-sm p-3 rounded-xl bg-paper border border-line text-ink outline-none focus:border-money" />
              </label>
              {error && <p className="text-xs font-bold text-alarm bg-alarm/10 p-2.5 rounded-xl">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setDoor("choose")} className="px-4 py-3 border border-line rounded-xl text-xs font-bold text-ink-2 hover:text-ink cursor-pointer">Back</button>
                <button type="button" disabled={busy} onClick={sendToWapc} className="flex-1 py-3 px-4 btn-primary rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                  {busy ? <><Loader2 size={16} className="animate-spin" /><span>Sending to the CA inbox…</span></> : <><Award size={16} /><span>Send to Wapsi certified CAs</span><ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {door === "wapc" && sent && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-ok-soft border border-ok/40 rounded-2xl">
                <Munshi size={56} state="secure" />
                <div className="text-sm text-ink space-y-1">
                  <p className="font-bold">Sent. Your return is in the CA inbox as request <span className="font-mono">{sent.code}</span>.</p>
                  <p className="text-[12.5px] text-ink-2">{reviewStatusLabel(sent)}. You will see it in your sidebar under <strong>Your return</strong>, and Munshi ji will tell you when a version comes back. You can keep working meanwhile.</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="w-full py-2.5 border border-line hover:bg-paper-2 text-ink text-xs font-semibold rounded-xl transition cursor-pointer">Back to my return</button>
            </div>
          )}

          {door === "own" && !record && (
            <form onSubmit={generateOwn} className="space-y-4">
              <div className="bg-amber-bg border border-money/40 rounded-2xl p-4 text-xs text-ink-2 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-ink"><Lock size={14} /><span>Zero-knowledge sharing</span></div>
                <p>Set a secret 4 to 6 digit PIN. Only the person with both your <strong>access code</strong> and this <strong>PIN</strong> can inspect or change your figures.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1"><span className="block text-xs font-bold text-ink">Set PIN</span><input type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} className="w-full text-center tracking-widest text-lg font-mono font-bold p-2.5 bg-paper border border-line rounded-xl focus:ring-2 focus:ring-money/40 focus:outline-none" autoFocus /></label>
                <label className="space-y-1"><span className="block text-xs font-bold text-ink">Confirm PIN</span><input type="password" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} className="w-full text-center tracking-widest text-lg font-mono font-bold p-2.5 bg-paper border border-line rounded-xl focus:ring-2 focus:ring-money/40 focus:outline-none" /></label>
              </div>
              {error && <p className="text-xs font-bold text-alarm bg-alarm/10 p-2.5 rounded-xl text-center">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setDoor("choose")} className="px-4 py-3 border border-line rounded-xl text-xs font-bold text-ink-2 hover:text-ink cursor-pointer">Back</button>
                <button type="submit" disabled={busy || pin.length < 4} className="flex-1 py-3 px-4 btn-primary rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}<span>Generate CA access code</span></button>
              </div>
            </form>
          )}

          {door === "own" && record && (
            <div className="space-y-4">
              <div className="text-center p-4 border-2 border-dashed border-money/40 rounded-2xl space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-money">Your CA access code</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider text-ink select-all">{record.code}</span>
                  <button onClick={() => copy(record.code)} className="p-2 rounded-xl bg-paper hover:bg-paper-2 border border-line shadow-xs transition cursor-pointer text-ink" title="Copy code">{copiedCode ? <Check size={18} className="text-money" /> : <Copy size={18} />}</button>
                </div>
                <p className="text-xs text-ink-3">Security PIN: <strong className="font-mono text-ink">{pin}</strong></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-ok hover:opacity-90 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"><MessageCircle size={16} /><span>Share on WhatsApp</span></a>
                <button type="button" onClick={() => copy(portalUrl, true)} className="flex items-center justify-center gap-2 p-3 bg-paper-2 hover:bg-paper-3 border border-line text-ink text-xs font-bold rounded-xl transition shadow-xs cursor-pointer">{copiedLink ? <Check size={16} className="text-money" /> : <ExternalLink size={16} />}<span>{copiedLink ? "Link copied" : "Copy portal link"}</span></button>
              </div>
              <div className="p-3.5 bg-paper-2 border border-line rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="size-2.5 rounded-full bg-money animate-ping" />
                  <div className="text-left"><span className="font-bold text-ink block">{record.status === "reviewed" ? "Your CA has sent a version back" : "Waiting for your CA"}</span><span className="text-ink-3 text-[11px]">{record.status === "reviewed" ? "Compare the two versions." : `They open it at /ca with the code and PIN.`}</span></div>
                </div>
                {record.status === "reviewed" ? <button onClick={() => { onReviewReceived?.(record); onClose(); }} className="px-3 py-1.5 bg-money text-white font-bold rounded-lg text-xs shadow-xs hover:opacity-90 cursor-pointer">Compare →</button> : <Clock size={16} className="text-ink-3" />}
              </div>
              <button type="button" onClick={onClose} className="w-full py-2.5 border border-line hover:bg-paper-2 text-ink text-xs font-semibold rounded-xl transition cursor-pointer">Close and return to filing</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
