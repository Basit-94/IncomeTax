"use client";

/**
 * Onboarding v3 (2026-09-07, user direction: "only mention those questions that can be exactly the
 * same every year"). Three screens that ask only what never changes — identity read from the PAN
 * record after the person links DigiLocker (mock), where refunds go, how much detail they like —
 * and nothing with a tax year on it. Employer, salary, housing, deductions and the regime are the
 * yearly intake, asked by Munshi ji when the return starts (lib/return/year-intake.ts).
 *
 * Shell unchanged from handoff §2: glass card, Munshi ji 64 asking in a bubble, h1 26/32, progress
 * bars, accent-soft selected rows, pinned Continue on phones.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, ShieldCheck } from "lucide-react";
import { Munshi, MunshiBubble } from "./brand/munshi";
import { LANGS, LANG_NATIVE, type Dict } from "../lib/i18n";
import { getOnboardingStrings } from "../lib/i18n/onboardingStrings";
import type { BankAccount, Lang } from "../lib/types";
import {
  createOnboardingProfile,
  saveOnboardingDraft,
  type OnboardingDraft,
  type OnboardingMode,
  type OnboardingProfile,
  type Residency,
} from "../lib/onboarding";

type Screen = "language" | "identity" | "refund";

/** What sign-up already knows about the person; the PAN record fills the rest. */
export interface OnboardingIdentitySeed {
  pan: string;
  name: string;
  dob?: string;
  mobile?: string;
  email?: string;
  address?: string;
}

interface OnboardingProps {
  lang: Lang;
  t: Dict;
  initialDraft: OnboardingDraft;
  onLanguageChange: (lang: Lang) => void;
  onComplete: (profile: OnboardingProfile) => void;
  identity?: OnboardingIdentitySeed;
}

const LANGUAGES: Lang[] = LANGS;
const MODES: OnboardingMode[] = ["simple", "full"];
const RESIDENCIES: Residency[] = ["resident", "nri", "rnor"];

function selectedClass(selected: boolean): string {
  return selected
    ? "border-money bg-amber-bg text-amber-ink"
    : "border-glass-edge bg-white/55 dark:bg-white/[0.05] text-ink hover:border-money/50";
}

function ChoiceButton({ selected, onClick, children, detail }: { selected: boolean; onClick: () => void; children: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-14 w-full items-start justify-between gap-4 rounded-[16px] border-[1.5px] px-4 py-3.5 text-left transition-colors active:translate-y-px cursor-pointer ${selectedClass(selected)}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-snug">{children}</span>
        {detail && <span className="mt-1 block text-xs leading-relaxed text-ink-2">{detail}</span>}
      </span>
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-money bg-money text-white" : "border-line text-transparent"}`} aria-hidden="true">
        <Check size={12} strokeWidth={3} />
      </span>
    </button>
  );
}

function Field({ label, value, onChange, placeholder, mono = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-bold text-ink-3">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-[46px] rounded-[14px] border-[1.5px] border-glass-edge bg-paper-3 px-4 text-[15px] text-ink focus:outline-none focus:border-money focus:ring-[3px] focus:ring-money/20 ${mono ? "font-mono tabular-nums" : ""}`}
      />
    </label>
  );
}

type IdentityPhase = "choose" | "consent" | "reading" | "review";

export default function Onboarding({ lang, t, initialDraft, onLanguageChange, onComplete, identity }: OnboardingProps) {
  const o = getOnboardingStrings(lang);
  const seeded: OnboardingDraft = useMemo(() => {
    const d: OnboardingDraft = { ...initialDraft };
    if (identity) {
      d.identity = { name: identity.name, pan: identity.pan, dob: identity.dob, ...(d.identity ?? {}) };
      d.contact = { mobile: identity.mobile, email: identity.email, address: identity.address, ...(d.contact ?? {}) };
    }
    return d;
  }, [initialDraft, identity]);
  const [draft, setDraft] = useState<OnboardingDraft>(seeded);
  const [screen, setScreen] = useState<Screen>(seeded.lang ? "identity" : "language");
  // A profile being edited (initialDraft has an identity) skips straight to the review.
  const [phase, setPhase] = useState<IdentityPhase>(initialDraft.identity?.pan ? "review" : "choose");
  const [readNote, setReadNote] = useState<string | null>(null);
  const [pulled, setPulled] = useState<string[]>([]);
  const [sample, setSample] = useState(false);
  const [addingBank, setAddingBank] = useState(false);
  const [newBank, setNewBank] = useState({ bank: "", last4: "", ifsc: "" });
  const [standingOpen, setStandingOpen] = useState(!!initialDraft.standing);

  useEffect(() => {
    setDraft(seeded);
  }, [seeded]);

  const updateDraft = (change: OnboardingDraft) => {
    const next = { ...draft, ...change };
    setDraft(next);
    saveOnboardingDraft(next);
  };

  const previewProfile = useMemo(() => createOnboardingProfile(draft, lang), [draft, lang]);
  const stepNumber = screen === "identity" ? 1 : screen === "refund" ? 2 : 0;

  const canContinue =
    screen === "language" ? Boolean(draft.lang)
    : screen === "identity" ? phase === "review" && Boolean(draft.identity?.pan && draft.identity?.name)
    : Boolean(previewProfile);

  const next = () => {
    if (!canContinue) return;
    if (screen === "language") setScreen("identity");
    else if (screen === "identity") setScreen("refund");
    else if (previewProfile) onComplete(previewProfile);
  };
  const back = () => {
    if (screen === "identity") {
      if (phase === "review" && !initialDraft.identity?.pan) setPhase("choose");
      else setScreen("language");
    } else if (screen === "refund") setScreen("identity");
  };

  const chooseLanguage = (nextLang: Lang) => {
    updateDraft({ lang: nextLang });
    onLanguageChange(nextLang);
  };

  /**
   * Link the locker (mock) and read the standing record — only after the consent card said yes. The person
   * watches the pull: the catalogue's identity documents tick off one by one as they arrive (2026-09-07).
   */
  const readLocker = async () => {
    setPhase("reading");
    setReadNote(null);
    setPulled([]);
    try {
      const linkRes = await fetch("/api/digilocker/link", { method: "POST", credentials: "same-origin" });
      if (!linkRes.ok) throw new Error(String(linkRes.status));
      const res = await fetch("/api/digilocker", { credentials: "same-origin" });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as {
        ok: boolean;
        profile: { identity: { name: string; pan: string; dob?: string; aadhaarLast4?: string }; contact: { address?: string; mobile?: string; email?: string }; banks: BankAccount[]; sample: boolean };
        documents: { uri: string; title: string; issuer: string; scope: "identity" | "year" }[];
      };
      const items = [...body.documents.filter((d) => d.scope === "identity").map((d) => `${d.title} · ${d.issuer}`), o.consentItems[2]];
      for (const item of items) {
        await new Promise((r) => setTimeout(r, 420));
        setPulled((list) => [...list, item]);
      }
      const p = body.profile;
      setSample(p.sample);
      updateDraft({
        identity: { ...(draft.identity ?? { name: p.identity.name, pan: p.identity.pan }), name: draft.identity?.name && !/^Citizen\s+\d{4}$/i.test(draft.identity.name) ? draft.identity.name : p.identity.name, pan: draft.identity?.pan || p.identity.pan, dob: p.identity.dob ?? draft.identity?.dob, aadhaarLast4: p.identity.aadhaarLast4 },
        contact: { ...(draft.contact ?? {}), address: draft.contact?.address || p.contact.address, mobile: draft.contact?.mobile || p.contact.mobile, email: draft.contact?.email || p.contact.email },
        banks: p.banks.length ? p.banks : draft.banks ?? [],
        refundAccountId: p.banks.find((b) => b.nominatedForRefund)?.id ?? p.banks[0]?.id ?? draft.refundAccountId,
        connections: { digilocker: { linked: true, linkedAt: new Date().toISOString() } },
      });
    } catch {
      setReadNote(o.readFailed);
      updateDraft({ connections: { digilocker: { linked: false } } });
    }
    setPhase("review");
  };

  const addBank = () => {
    if (!newBank.bank.trim() || !/^\d{4}$/.test(newBank.last4)) return;
    const account: BankAccount = {
      id: `bank-${Date.now().toString(36)}`,
      bank: newBank.bank.trim(),
      maskedNumber: `•••• •••• ${newBank.last4}`,
      ifsc: newBank.ifsc.trim().toUpperCase(),
      status: "under_process",
      nominatedForRefund: !(draft.banks?.length),
    };
    const banks = [...(draft.banks ?? []), account];
    updateDraft({ banks, refundAccountId: draft.refundAccountId ?? account.id });
    setNewBank({ bank: "", last4: "", ifsc: "" });
    setAddingBank(false);
  };

  const bubble =
    screen === "language" ? o.languageQuestion
    : screen === "identity" ? o.identityBubble
    : o.refundBubble;

  return (
    <div className="mx-auto max-w-[760px] py-2 sm:py-5 max-md:pb-24">
      <div className="glass rounded-[24px] overflow-hidden max-md:bg-transparent max-md:border-0 max-md:shadow-none max-md:rounded-none max-md:overflow-visible max-md:backdrop-blur-none">
        <div className="border-b border-line px-1 py-2 md:px-7 md:py-3.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-money">{o.eyebrow}</span>
            {stepNumber > 0 && <span className="text-[11.5px] text-ink-3">{o.stepOf(stepNumber, 2)}</span>}
          </div>
          {stepNumber > 0 && (
            <div className="mt-3 max-md:mt-2 flex gap-1.5 max-md:gap-1" aria-hidden="true">
              {[1, 2].map((item) => (
                <span key={item} className={`h-1.5 max-md:h-[5px] flex-1 rounded-[3px] ${item <= stepNumber ? "bg-money" : "bg-ink-2/15"}`} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 px-1 py-4 md:px-8 md:py-7">
          <div className="flex items-start gap-3">
            <span className="max-md:hidden shrink-0"><Munshi size={64} state={phase === "reading" ? "reading" : screen === "refund" ? "happy" : "listening"} /></span>
            <span className="md:hidden shrink-0"><Munshi size={52} state={phase === "reading" ? "reading" : screen === "refund" ? "happy" : "listening"} /></span>
            <MunshiBubble className="!py-2 !px-3.5 text-[15px] max-md:text-[13.5px] rounded-[14px_14px_14px_4px]">{bubble}</MunshiBubble>
          </div>

          {screen === "language" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-[26px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink md:text-[32px]">{o.languageQuestion}</h1>
                <p className="max-w-xl text-sm leading-relaxed text-ink-2">{o.languageHelp}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {LANGUAGES.map((item) => (
                  <ChoiceButton key={item} selected={draft.lang === item} onClick={() => chooseLanguage(item)}>{LANG_NATIVE[item]}</ChoiceButton>
                ))}
              </div>
            </div>
          )}

          {screen === "identity" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-[26px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink md:text-[32px]">{o.identityTitle}</h1>
                <p className="text-sm leading-relaxed text-ink-2">{o.identityHelp}</p>
              </div>

              {phase === "choose" && (
                <div className="grid gap-3">
                  <ChoiceButton selected={false} onClick={() => setPhase("consent")} detail={o.linkDigiLockerDetail}>{o.linkDigiLocker}</ChoiceButton>
                  <ChoiceButton selected={false} onClick={() => { updateDraft({ connections: { digilocker: { linked: false } } }); setPhase("review"); }} detail={o.fillMyselfDetail}>{o.fillMyself}</ChoiceButton>
                </div>
              )}

              {phase === "consent" && (
                <div className="glass-flat rounded-[18px] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-ink font-bold text-sm"><ShieldCheck size={16} className="text-money" aria-hidden="true" /> {o.consentTitle}</div>
                  <ul className="space-y-1.5 text-sm text-ink-2">
                    {o.consentItems.map((item) => <li key={item} className="flex gap-2"><span className="mt-[7px] size-1.5 rounded-full bg-money shrink-0" aria-hidden="true" />{item}</li>)}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={() => void readLocker()} className="btn-primary rounded-[14px] h-[46px] px-5 text-[14.5px] cursor-pointer">{o.consentYes}</button>
                    <button type="button" onClick={() => setPhase("choose")} className="glass-flat rounded-[14px] h-[46px] px-4 text-[14.5px] font-semibold text-ink-2 hover:text-ink cursor-pointer">{o.consentNo}</button>
                  </div>
                </div>
              )}

              {phase === "reading" && (
                <div className="glass-flat rounded-[18px] p-4 space-y-2" role="status" aria-live="polite">
                  <p className="text-sm font-semibold text-ink">{o.reading}</p>
                  <ul className="space-y-1.5 text-[13px] text-ink-2">
                    {o.consentItems.map((label, i) => {
                      const done = pulled.length > i;
                      return (
                        <li key={label} className="flex items-center gap-2">
                          <span className={`inline-flex size-4 items-center justify-center rounded-full ${done ? "bg-ok text-white" : "border border-line text-transparent"}`} aria-hidden="true"><Check size={10} strokeWidth={3} /></span>
                          <span className={done ? "text-ink" : ""}>{pulled[i] ?? label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {phase === "review" && (
                <div className="space-y-4">
                  {readNote && <p className="rounded-[14px] bg-warn-soft px-4 py-2.5 text-[13px] text-warn">{readNote}</p>}
                  {sample && <p className="text-xs text-ink-3">{o.sampleNote}</p>}
                  <div className="glass-flat rounded-[18px] divide-y divide-line">
                    <div className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink truncate">{draft.identity?.name || "—"}</p>
                        <p className="font-mono text-[13px] text-ink-2">{draft.identity?.pan || "—"}{draft.identity?.dob ? ` · ${draft.identity.dob}` : ""}{draft.identity?.aadhaarLast4 ? ` · Aadhaar ····${draft.identity.aadhaarLast4}` : ""}</p>
                        <p className="text-[11px] text-ink-3">{draft.connections?.digilocker.linked ? o.nameFromDigiLocker : o.fromPanRecord}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-paper-3 px-2.5 py-1 text-[11px] font-semibold text-ink-3 shrink-0"><Lock size={11} aria-hidden="true" /> {o.locked}</span>
                    </div>
                    <div className="px-4 py-3 grid gap-3 sm:grid-cols-2">
                      <Field label={`${o.addressLabel} · ${draft.connections?.digilocker.linked ? o.fromAadhaar : o.edit}`} value={draft.contact?.address ?? ""} onChange={(v) => updateDraft({ contact: { ...(draft.contact ?? {}), address: v } })} />
                      <Field label={o.mobileLabel} value={draft.contact?.mobile ?? ""} onChange={(v) => updateDraft({ contact: { ...(draft.contact ?? {}), mobile: v } })} mono />
                      <Field label={o.emailLabel} value={draft.contact?.email ?? ""} onChange={(v) => updateDraft({ contact: { ...(draft.contact ?? {}), email: v } })} />
                      <label className="block space-y-1">
                        <span className="block text-xs font-bold text-ink-3">{o.residencyLabel}</span>
                        <select value={draft.residency ?? "resident"} onChange={(e) => updateDraft({ residency: e.target.value as Residency })} className="w-full h-[46px] rounded-[14px] border-[1.5px] border-glass-edge bg-paper-3 px-4 text-[15px] text-ink">
                          {RESIDENCIES.map((r) => <option key={r} value={r}>{r === "resident" ? o.residencyResident : r === "nri" ? o.residencyNri : o.residencyRnor}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {screen === "refund" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-[26px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink md:text-[32px]">{o.refundTitle}</h1>
                <p className="text-sm leading-relaxed text-ink-2">{o.refundHelp}</p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-bold text-ink">{o.refundAccountLabel}</h2>
                {(draft.banks ?? []).length === 0 && !addingBank && <p className="text-sm text-ink-2">{o.noAccounts}</p>}
                <div className="grid gap-2">
                  {(draft.banks ?? []).map((b) => (
                    <ChoiceButton key={b.id} selected={draft.refundAccountId === b.id} onClick={() => updateDraft({ refundAccountId: b.id })} detail={b.status === "validated" ? `${b.ifsc} · ${o.preValidated}` : b.ifsc}>
                      <span className="font-mono">{b.bank} {b.maskedNumber}</span>
                    </ChoiceButton>
                  ))}
                </div>
                {addingBank ? (
                  <div className="glass-flat rounded-[18px] p-4 grid gap-3 sm:grid-cols-3">
                    <Field label={o.bankNameLabel} value={newBank.bank} onChange={(v) => setNewBank((n) => ({ ...n, bank: v }))} />
                    <Field label={o.accountLast4Label} value={newBank.last4} onChange={(v) => setNewBank((n) => ({ ...n, last4: v.replace(/\D/g, "").slice(0, 4) }))} mono />
                    <Field label={o.ifscLabel} value={newBank.ifsc} onChange={(v) => setNewBank((n) => ({ ...n, ifsc: v }))} mono />
                    <div className="sm:col-span-3 flex gap-2">
                      <button type="button" onClick={addBank} className="btn-primary rounded-[14px] h-[38px] px-4 text-[13px] cursor-pointer">{o.addAccount}</button>
                      <button type="button" onClick={() => setAddingBank(false)} className="glass-flat rounded-[14px] h-[38px] px-4 text-[13px] font-semibold text-ink-2 cursor-pointer">{o.back}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setAddingBank(true)} className="text-sm font-semibold text-money hover:underline cursor-pointer">+ {o.addAccount}</button>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-bold text-ink">{o.detailLabel}</h2>
                <div className="grid gap-3">
                  {MODES.map((mode) => (
                    <ChoiceButton key={mode} selected={draft.mode === mode} onClick={() => updateDraft({ mode })} detail={mode === "simple" ? o.modeSimpleDetail : o.modeFullDetail}>
                      {mode === "simple" ? o.modeSimple : o.modeFull}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button type="button" onClick={() => setStandingOpen((v) => !v)} aria-expanded={standingOpen} className="text-sm font-semibold text-ink-2 hover:text-ink cursor-pointer">
                  {standingOpen ? "▾" : "▸"} {o.standingToggle}
                </button>
                {standingOpen && (
                  <div className="glass-flat rounded-[18px] p-4 space-y-4">
                    <p className="text-xs text-ink-3">{o.standingHelp}</p>
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" checked={!!draft.standing?.representative} onChange={(e) => updateDraft({ standing: { ...(draft.standing ?? {}), representative: e.target.checked ? { name: "", capacity: "" } : undefined } })} />
                      {o.representativeLabel}
                    </label>
                    {draft.standing?.representative && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={o.representativeNameLabel} value={draft.standing.representative.name} onChange={(v) => updateDraft({ standing: { ...draft.standing, representative: { ...draft.standing!.representative!, name: v } } })} />
                        <Field label={o.representativeCapacityLabel} value={draft.standing.representative.capacity} onChange={(v) => updateDraft({ standing: { ...draft.standing, representative: { ...draft.standing!.representative!, capacity: v } } })} />
                      </div>
                    )}
                    <label className="block space-y-1">
                      <span className="block text-xs font-bold text-ink-3">{o.disabilityLabel}</span>
                      <select value={draft.standing?.disability ?? ""} onChange={(e) => updateDraft({ standing: { ...(draft.standing ?? {}), disability: (e.target.value || undefined) as "40_79" | "80_plus" | undefined } })} className="w-full h-[46px] rounded-[14px] border-[1.5px] border-glass-edge bg-paper-3 px-4 text-[15px] text-ink">
                        <option value="">{o.disabilityNone}</option>
                        <option value="40_79">{o.disability40}</option>
                        <option value="80_plus">{o.disability80}</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>

              <p className="text-xs leading-relaxed text-ink-3">{o.nothingYearly}</p>
            </div>
          )}

          <p className="text-xs leading-relaxed text-ink-3">{o.savedLocally}</p>

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="md:contents max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:px-4 max-md:pb-7 max-md:pt-2.5 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)]">
              <button type="button" onClick={next} disabled={!canContinue} className="btn-primary md:hidden inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] px-5 text-[14.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer">
                {screen === "refund" ? o.saveProfile : screen === "identity" && phase === "review" ? o.thatsMe : o.continue}
                <ChevronRight size={16} />
              </button>
            </div>
            {screen !== "language" ? (
              <button type="button" onClick={back} className="inline-flex h-[46px] items-center justify-center gap-1.5 rounded-[14px] px-4 text-sm font-semibold text-ink-2 hover:text-ink cursor-pointer">
                <ChevronLeft size={16} /> {o.back}
              </button>
            ) : <span />}
            <button type="button" onClick={next} disabled={!canContinue} className="btn-primary max-md:hidden inline-flex h-[46px] items-center justify-center gap-2 rounded-[14px] px-5 text-[14.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer">
              {screen === "refund" ? o.saveProfile : screen === "identity" && phase === "review" ? o.thatsMe : o.continue}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      {/* t stays in the signature so the two callers do not change; the legacy dictionary keys remain for them. */}
      <span className="sr-only">{t.onboarding.eyebrow}</span>
    </div>
  );
}
