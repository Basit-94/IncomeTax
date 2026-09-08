"use client";

/**
 * The CA portal (redesigned 2026-09-08).
 *
 *  1. Register as a Wapsi certified CA (verified on Wapsi against the ICAI membership number) or sign in — a CA
 *     cookie, separate from the citizen's.
 *  2. Dashboard: every citizen's broadcast request ("Get it verified by a Wapsi certified CA") lands in the inbox;
 *     the first CA to take one holds it. "My reviews" lists what this CA holds or finished. A client code + PIN
 *     card keeps the own-CA flow exactly as it was.
 *  3. Review workspace: the client's background (who they are, their income, their situation in their words), the
 *     full return as editable worksheets, and inline comments on any row — click the bubble on a line, write,
 *     done — the way one comments on a Figma frame. Then send the version back.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Award, Check, ChevronLeft, Inbox, Lock, LogOut, MessageSquare, Moon, RefreshCw, Save, ShieldCheck, Sun, UserRound, X } from "lucide-react";
import type { Claim, IncomeKind, Lang, Persona, TaxAlreadyPaid } from "@/lib/types";
import { formatAmount, formatMoney } from "@/lib/money";
import { computeForPersona } from "@/lib/return/compute";
import { fetchReviewRecord, submitCAReview, verifyPin, type CAReviewRecord } from "@/lib/ca/ca-store";
import { caAuth, caInbox, reviewApi, reviewStatusLabel, type PublicReview } from "@/lib/ca/client";
import type { PublicCAAccount, ReviewComment } from "@/lib/ca/server-store";
import LanguageMenu from "@/components/ui/language-menu";
import { Munshi, MunshiAvatar } from "@/components/brand/munshi";

type Open = { review: PublicReview | CAReviewRecord; viaAccount: boolean };

const ANCHOR_LABELS: Record<string, string> = { regime: "Regime", summary: "Overall", "taxPaid:tds": "TDS / advance tax" };

/* --------------------------------------------------------------- worksheet -- */

type Row = { key: string; anchor: string; line: string; section: string; filed: number; revised: number; onChange: (v: number) => void };

function Worksheet({ title, meta, rows, totalLabel, total, totalTone = "text-ink", lang, comments, activeAnchor, onToggleAnchor, onComment, canComment, draft, setDraft, note }: {
  title: string; meta: string; rows: Row[]; totalLabel: string; total: number; totalTone?: string; lang: Lang;
  comments: ReviewComment[]; activeAnchor: string | null; onToggleAnchor: (a: string) => void; onComment: (anchor: string, text: string) => Promise<void>; canComment: boolean;
  draft: string; setDraft: (s: string) => void; note?: React.ReactNode;
}) {
  const parse = (raw: string) => { const s = raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, ""); return s === "" ? 0 : Math.max(0, Number(s)); };
  return (
    <section className="glass rounded-[24px] px-[22px] py-[18px]">
      <header className="flex items-baseline justify-between gap-3 flex-wrap"><h4 className="text-[15px] font-extrabold text-ink">{title}</h4><span className="text-[11px] text-ink-3">{meta}</span></header>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_88px_108px_128px_72px_36px] gap-2 max-md:hidden pb-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
        <span>Line</span><span>Section</span><span>Client filed</span><span>CA revised</span><span>Δ</span><span />
      </div>
      {rows.map((row) => {
        const delta = row.revised - row.filed;
        const rowComments = comments.filter((c) => c.anchor === row.anchor);
        const active = activeAnchor === row.anchor;
        return (
          <div key={row.key} className={`border-b border-dashed border-glass-edge last:border-b-0 ${active ? "bg-amber-bg/40 -mx-2 px-2 rounded-xl" : ""}`}>
            <div className="grid md:grid-cols-[minmax(0,1fr)_88px_108px_128px_72px_36px] grid-cols-[minmax(0,1fr)_128px_36px] gap-2 items-center py-2 text-[13px]">
              <span className={`font-semibold min-w-0 truncate ${row.filed === 0 && row.revised === 0 ? "text-ink-3" : "text-ink"}`}>{row.line}<span className="md:hidden block text-[11px] font-mono text-ink-3">{row.section} · client {formatAmount(row.filed, lang)}</span></span>
              <span className="max-md:hidden font-mono text-[12px] text-ink-3">{row.section}</span>
              <span className="max-md:hidden font-mono tabular-nums text-ink-2">{formatAmount(row.filed, lang)}</span>
              <input type="number" min="0" inputMode="numeric" placeholder="0" aria-label={`${row.line} — CA revised`} value={row.revised === 0 ? "" : String(row.revised)} onChange={(e) => row.onChange(parse(e.target.value))} className="h-9 w-full rounded-[10px] border-[1.5px] border-glass-edge bg-white/80 dark:bg-white/10 px-2.5 text-right font-mono text-[13px] font-semibold tabular-nums text-ink outline-none focus:border-money" />
              <span className={`max-md:hidden font-mono tabular-nums text-[12px] font-bold ${delta === 0 ? "text-ink-3" : delta > 0 ? "text-ok-ink" : "text-warn"}`}>{delta === 0 ? "—" : `${delta > 0 ? "+" : "−"}${formatAmount(Math.abs(delta), lang)}`}</span>
              <button type="button" onClick={() => onToggleAnchor(row.anchor)} title="Comment on this line" aria-label={`Comment on ${row.line}`} className={`size-8 rounded-full grid place-items-center cursor-pointer transition ${rowComments.length ? "bg-money text-white" : active ? "bg-amber-bg text-amber-ink" : "text-ink-3 hover:text-money hover:bg-paper-2"}`}>
                <span className="relative"><MessageSquare size={14} />{rowComments.length > 0 && <span className="absolute -top-2 -right-2 text-[9px] font-extrabold bg-paper text-money rounded-full px-1 border border-money/40">{rowComments.length}</span>}</span>
              </button>
            </div>
            {(active || rowComments.length > 0) && (
              <CommentThread anchor={row.anchor} label={row.line} comments={rowComments} active={active} canComment={canComment} draft={draft} setDraft={setDraft} onComment={onComment} onClose={() => onToggleAnchor(row.anchor)} />
            )}
          </div>
        );
      })}
      <div className="mt-3 pt-3 border-t border-glass-edge flex items-center justify-between gap-3">
        <span className="text-[12.5px] font-bold text-ink-2">{totalLabel}</span>
        <span className={`font-mono text-[15px] font-extrabold tabular-nums ${totalTone}`}>{formatMoney(total, lang)}</span>
      </div>
      {note && <div className="mt-3">{note}</div>}
    </section>
  );
}

function CommentThread({ anchor, label, comments, active, canComment, draft, setDraft, onComment, onClose }: { anchor: string; label: string; comments: ReviewComment[]; active: boolean; canComment: boolean; draft: string; setDraft: (s: string) => void; onComment: (anchor: string, text: string) => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mb-2.5 ms-2 ps-3 border-s-2 border-money/50 space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="text-[12.5px]"><span className="font-bold text-ink">{c.author.name}</span><span className="text-ink-3"> · {new Date(c.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><p className="text-ink leading-relaxed whitespace-pre-wrap">{c.text}</p></div>
      ))}
      {active && (
        canComment ? (
          <form className="flex items-start gap-2" onSubmit={async (e) => { e.preventDefault(); if (!draft.trim()) return; setBusy(true); try { await onComment(anchor, draft.trim()); setDraft(""); } finally { setBusy(false); } }}>
            <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder={`Comment on ${label} — the client reads it beside this line.`} className="flex-1 rounded-[12px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge p-2.5 text-[13px] text-ink focus:border-money focus:outline-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit(); } }} />
            <div className="flex flex-col gap-1.5">
              <button type="submit" disabled={busy || !draft.trim()} className="btn-primary h-9 px-3 rounded-[10px] text-[12.5px] cursor-pointer disabled:opacity-50">{busy ? "…" : "Post"}</button>
              <button type="button" onClick={onClose} className="h-9 px-3 rounded-[10px] border border-glass-edge text-[12.5px] text-ink-2 cursor-pointer" aria-label="Close comment box"><X size={13} /></button>
            </div>
          </form>
        ) : <p className="text-[12px] text-ink-3">Comments need a registered CA account — sign in on the portal to leave one.</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- page -- */

function CAPortalContent() {
  const params = useSearchParams();
  const urlCode = params.get("code") || "";

  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  useEffect(() => { const t = localStorage.getItem("wapsi_theme"); if (t === "dark" || t === "light") setTheme(t); }, []);
  useEffect(() => { for (const el of [document.documentElement, document.body]) { el?.classList.toggle("dark", theme === "dark"); el?.classList.toggle("dark-mode", theme === "dark"); } }, [theme]);
  const toggleTheme = () => { const n = theme === "dark" ? "light" : "dark"; setTheme(n); localStorage.setItem("wapsi_theme", n); };

  // Account
  const [me, setMe] = useState<PublicCAAccount | null | undefined>(undefined);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [reg, setReg] = useState({ name: "", membershipNo: "", password: "", firmName: "", city: "", email: "", phone: "" });

  // Inbox
  const [inbox, setInbox] = useState<{ open: PublicReview[]; mine: PublicReview[] }>({ open: [], mine: [] });
  const [inboxBusy, setInboxBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Own-CA card
  const [code, setCode] = useState(urlCode);
  const [pin, setPin] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);

  // Review workspace
  const [open, setOpen] = useState<Open | null>(null);
  const [caPersona, setCaPersona] = useState<Persona | null>(null);
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [notes, setNotes] = useState("");
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stamp, setStamp] = useState({ name: "", membershipNo: "", firmName: "" });

  const loadInbox = useCallback(async () => {
    setInboxBusy(true);
    try { const r = await caInbox(); setInbox({ open: r.open, mine: r.mine }); setMe(r.account); } catch { /* signed out */ } finally { setInboxBusy(false); }
  }, []);

  useEffect(() => {
    caAuth.me().then((r) => { setMe(r.account); if (r.account) { setStamp({ name: r.account.name, membershipNo: r.account.membershipNo, firmName: r.account.firmName }); void loadInbox(); } }).catch(() => setMe(null));
  }, [loadInbox]);
  useEffect(() => {
    if (!me || open) return;
    const t = setInterval(() => void loadInbox(), 8000);
    return () => clearInterval(t);
  }, [me, open, loadInbox]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthBusy(true); setAuthError(null);
    try { const r = await caAuth.login(loginId, loginPw); setMe(r.account); setStamp({ name: r.account.name, membershipNo: r.account.membershipNo, firmName: r.account.firmName }); await loadInbox(); } catch (err) { setAuthError(err instanceof Error ? err.message : "Sign-in failed."); } finally { setAuthBusy(false); }
  };
  const register = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthBusy(true); setAuthError(null);
    try { const r = await caAuth.register(reg); setMe(r.account); setStamp({ name: r.account.name, membershipNo: r.account.membershipNo, firmName: r.account.firmName }); await loadInbox(); } catch (err) { setAuthError(err instanceof Error ? err.message : "Registration failed."); } finally { setAuthBusy(false); }
  };
  const signOut = async () => { await caAuth.logout().catch(() => undefined); setMe(null); setOpen(null); setInbox({ open: [], mine: [] }); };

  const enterWorkspace = (review: PublicReview | CAReviewRecord, viaAccount: boolean, existingComments: ReviewComment[] = []) => {
    setOpen({ review, viaAccount });
    setCaPersona(structuredClone(review.caPersona ?? review.originalPersona));
    setRegime(review.caRegime ?? review.originalRegime ?? "new");
    setNotes(review.caNotes ?? "");
    setComments(existingComments);
    setActiveAnchor(null);
    setSaved(false);
    if (review.caDetails?.name && !me) setStamp({ name: review.caDetails.name, membershipNo: review.caDetails.membershipNo ?? "", firmName: review.caDetails.firmName ?? "" });
  };

  /** From the inbox: a broadcast request is claimed first (first come, first served), then opened with its comments. */
  const openFromInbox = async (r: PublicReview) => {
    setClaimError(null);
    try {
      const claimed = r.mode === "wapc" && r.status === "pending" && !r.claimedByCaId ? (await reviewApi.claim(r.code)).review : r;
      const full = await reviewApi.get(claimed.code);
      enterWorkspace(full.review, true, full.comments);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Could not open this request.");
      void loadInbox();
    }
  };

  /** The own-CA card: code + PIN, verified here as before. A signed-in CA can also open a broadcast request by its code. */
  const openByCode = async (e: React.FormEvent) => {
    e.preventDefault(); setCodeBusy(true); setCodeError(null);
    try {
      const clean = code.toUpperCase().trim();
      const rec = await fetchReviewRecord(clean, true);
      if (!rec) { setCodeError(`No return found for code ${clean}.`); return; }
      const isBroadcast = (rec as Partial<PublicReview>).mode === "wapc";
      if (!isBroadcast && !(await verifyPin(rec, pin.trim()))) { setCodeError("Incorrect PIN — ask the client for the PIN they set."); return; }
      if (me) { try { const full = await reviewApi.get(clean); enterWorkspace(full.review, true, full.comments); return; } catch { /* fall through */ } }
      enterWorkspace(rec, false);
    } catch { setCodeError("Could not open the return. Try again."); } finally { setCodeBusy(false); }
  };

  const send = async () => {
    if (!open || !caPersona) return;
    setSaving(true);
    try {
      const details = { name: stamp.name || "Chartered Accountant", membershipNo: stamp.membershipNo || undefined, firmName: stamp.firmName || undefined };
      if (open.viaAccount) {
        const r = await reviewApi.submit(open.review.code, { caPersona, caRegime: regime, caNotes: notes, caDetails: details });
        setOpen({ review: r.review, viaAccount: true });
      } else {
        const r = await submitCAReview({ code: open.review.code, caPersona, caRegime: regime, caNotes: notes, caDetails: details });
        if (r) setOpen({ review: r, viaAccount: false });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      void loadInbox();
    } finally { setSaving(false); }
  };

  const postComment = async (anchor: string, text: string) => {
    if (!open) return;
    const r = await reviewApi.comment(open.review.code, anchor, text);
    setComments((cs) => [...cs, r.comment]);
  };

  /* -- editing helpers (the figures are a plain persona; the engine recomputes below) -- */
  const setIncome = (kind: IncomeKind, amount: number) => setCaPersona((p) => {
    if (!p) return p;
    const facts = p.facts.map((f) => ({ ...f }));
    const i = facts.findIndex((f) => f.kind === kind);
    if (i >= 0) facts[i].amount = amount;
    else if (amount > 0) facts.push({ id: `ca_fact_${kind}_${Date.now()}`, kind, amount, label: kind === "capital_gains" ? "Capital gains on securities" : kind.replace(/_/g, " "), ...(kind === "capital_gains" ? { capitalGains: { assetClass: "equity_stt" as const, holding: "short" as const } } : {}), provenance: { reporter: "CA review adjustment", reporterKind: "self", filedOn: new Date().toISOString().slice(0, 10), statement: "self", onlyReporterCanFix: false } });
    return { ...p, facts };
  });
  const CLAIM_SECTIONS: { key: string; section: string; label: string; line: string; law: string; match: (c: Claim) => boolean }[] = [
    { key: "80C", section: "80C", label: "Section 80C — Provident fund, LIC, ELSS, tuition", line: "Provident fund, LIC, ELSS, tuition", law: "80C", match: (c) => c.section === "80C" || c.section.startsWith("80C_") },
    { key: "80D_SELF", section: "80D_SELF", label: "Section 80D — Health cover, self & family", line: "Health cover — self & family", law: "80D", match: (c) => c.section === "80D" || c.section === "80D_SELF" },
    { key: "80D_PARENTS", section: "80D_PARENTS", label: "Section 80D — Health cover, parents", line: "Health cover — parents", law: "80D", match: (c) => c.section === "80D_PARENTS" },
    { key: "80CCD_1B", section: "80CCD_1B", label: "Section 80CCD(1B) — NPS Tier-I", line: "NPS Tier-I additional", law: "80CCD(1B)", match: (c) => c.section === "80CCD_1B" || c.section === "80CCD(1B)" },
    { key: "80CCD_2", section: "80CCD(2)", label: "Section 80CCD(2) — Employer NPS", line: "Employer NPS", law: "80CCD(2)", match: (c) => c.section === "80CCD(2)" || c.section === "80CCD_2" },
    { key: "80TTA", section: "80TTA", label: "Section 80TTA — Savings interest", line: "Savings-account interest", law: "80TTA", match: (c) => c.section === "80TTA" },
    { key: "80GG", section: "80GG", label: "Section 80GG — Rent paid, no HRA", line: "Rent paid (no HRA)", law: "80GG", match: (c) => c.section === "80GG" },
    { key: "24B", section: "24B", label: "Section 24(b) — Home-loan interest", line: "Home-loan interest", law: "24(b)", match: (c) => c.section === "24B" || c.section === "24(b)" || c.section === "24b" },
  ];
  const setClaim = (spec: (typeof CLAIM_SECTIONS)[number], amount: number) => setCaPersona((p) => {
    if (!p) return p;
    const claims = p.claims.map((c) => ({ ...c }));
    const i = claims.findIndex(spec.match);
    if (i >= 0) claims[i].amount = amount;
    else if (amount > 0) claims.push({ id: `ca_claim_${spec.key}_${Date.now()}`, section: spec.section, amount, label: spec.label, evidenceAttached: true });
    return { ...p, claims };
  });
  const setTds = (amount: number) => setCaPersona((p) => {
    if (!p) return p;
    const taxPaid: TaxAlreadyPaid[] = [{ id: "ca_tds_consolidated", label: "TDS / advance tax (Form 26AS, CA verified)", amount, section: "192", provenance: { reporter: "Form 26AS / AIS verified by CA", reporterKind: "department", filedOn: new Date().toISOString().slice(0, 10), statement: "26AS", onlyReporterCanFix: false } }];
    return { ...p, taxPaid };
  });

  const original = open?.review.originalPersona;
  const originalB = useMemo(() => (open ? computeForPersona(open.review.originalPersona, open.review.originalRegime) : null), [open]);
  const caB = useMemo(() => (caPersona ? computeForPersona(caPersona, regime) : null), [caPersona, regime]);
  const both = useMemo(() => (caPersona ? { new: computeForPersona(caPersona, "new"), old: computeForPersona(caPersona, "old") } : null), [caPersona]);
  const amountOf = (p: Persona | undefined, kind: IncomeKind) => p?.facts.filter((f) => f.kind === kind).reduce((n, f) => n + f.amount, 0) ?? 0;
  const incomeRows: Row[] = (["salary", "interest", "dividend", "capital_gains", "rent", "other"] as IncomeKind[]).map((kind) => {
    const reporter = original?.facts.find((f) => f.kind === kind)?.provenance.reporter;
    const names: Record<IncomeKind, [string, string]> = { salary: ["Salary", "s.17"], interest: ["Interest", "s.56"], dividend: ["Dividends", "s.56"], capital_gains: ["Sale of listed shares & assets", "s.111A/112A"], rent: ["House property — rent received", "s.22"], other: ["Other taxable receipts", "s.56"] };
    return { key: kind, anchor: `income:${kind}`, line: reporter ? `${names[kind][0]} — ${reporter}` : names[kind][0], section: names[kind][1], filed: amountOf(original, kind), revised: amountOf(caPersona ?? undefined, kind), onChange: (v) => setIncome(kind, v) };
  });
  const deductionRows: Row[] = CLAIM_SECTIONS.map((spec) => ({ key: spec.key, anchor: `deduction:${spec.section}`, line: spec.line, section: spec.law, filed: original?.claims.filter(spec.match).reduce((n, c) => n + c.amount, 0) ?? 0, revised: caPersona?.claims.filter(spec.match).reduce((n, c) => n + c.amount, 0) ?? 0, onChange: (v) => setClaim(spec, v) }));
  const taxRows: Row[] = [{ key: "tds", anchor: "taxPaid:tds", line: "TDS / advance tax — Form 26AS", section: "s.192", filed: original?.taxPaid.reduce((n, t) => n + t.amount, 0) ?? 0, revised: caPersona?.taxPaid.reduce((n, t) => n + t.amount, 0) ?? 0, onChange: setTds }];

  const toggleAnchor = (a: string) => setActiveAnchor((cur) => (cur === a ? null : a));
  const firstName = open?.review.citizenName.split(" ")[0] ?? "the client";
  const position = (n: number) => (n < 0 ? `${formatMoney(-n, lang)} due` : `${formatMoney(n, lang)} refund`);
  const tone = (n: number) => (n < 0 ? "text-bad" : n > 0 ? "text-ok-ink" : "text-ink");
  const bg = open ? (open.review as PublicReview).background : undefined;

  /* ----------------------------------------------------------------- render -- */
  return (
    <div className="min-h-screen text-ink flex flex-col font-sans">
      <header className="border-b border-glass-edge bg-paper/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <MunshiAvatar size={38} state={saving ? "working" : saved ? "happy" : "idle"} />
            <div>
              <div className="flex items-center gap-2"><span className="font-extrabold text-base tracking-tight text-ink-2">Wapsi Professional</span><span className="px-2 py-0.5 rounded-full bg-amber-bg text-money text-[10px] font-mono font-bold uppercase tracking-wider border border-money/40">CA portal</span></div>
              <p className="text-[11px] text-ink-3">AY 2026-27 (FY 2025-26)</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-bg border border-money/30 text-xs">
                <Award size={14} className="text-money" /><span className="font-bold text-ink truncate max-w-[160px]">{me.name}</span><span className="text-ink-3 font-mono text-[11px]">#{me.membershipNo}</span><span className="px-1.5 py-0.5 rounded bg-ok-soft text-ok-ink text-[10px] font-bold">Wapsi certified</span>
                <button type="button" onClick={signOut} title="Sign out" className="ml-1 text-ink-3 hover:text-alarm cursor-pointer p-0.5"><LogOut size={13} /></button>
              </div>
            )}
            <LanguageMenu lang={lang} onChange={setLang} label="Language" />
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-paper-3 border border-line text-ink-2 transition cursor-pointer" aria-label="Toggle theme">{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* ---------------------------------------------------------- auth -- */}
        {me === undefined && <p className="text-center text-sm text-ink-3 py-20 font-mono">Opening the portal…</p>}

        {me === null && !open && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start py-4 sm:py-8">
            <div className="glass rounded-[28px] px-5 py-6 sm:px-7 sm:py-7 space-y-5">
              <div className="flex items-start gap-3.5">
                <Munshi size={56} state={authError ? "concerned" : authBusy ? "working" : "welcome"} />
                <div><h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Chartered Accountants</h2><p className="mt-1 text-[13.5px] text-ink-2 leading-[1.55]">Register once as a Wapsi certified CA — verified on Wapsi against your ICAI membership number — and every citizen who asks for a certified review lands in your inbox.</p></div>
              </div>
              <div className="inline-flex p-1 rounded-[14px] glass-flat">
                {(["login", "register"] as const).map((t) => <button key={t} type="button" onClick={() => { setAuthTab(t); setAuthError(null); }} className={`h-9 px-4 rounded-[10px] text-[13px] font-bold cursor-pointer ${authTab === t ? "ink-surface text-white" : "text-ink-2"}`}>{t === "login" ? "Sign in" : "Register"}</button>)}
              </div>
              {authTab === "login" ? (
                <form onSubmit={signIn} className="space-y-3">
                  <Field label="ICAI membership number or email"><input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" className={inputCls} placeholder="084920 or you@firm.in" /></Field>
                  <Field label="Password"><input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} autoComplete="current-password" className={inputCls} /></Field>
                  {authError && <ErrorLine text={authError} />}
                  <button type="submit" disabled={authBusy} className="btn-primary h-[48px] w-full rounded-[14px] text-[14.5px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"><Lock size={16} /><span>{authBusy ? "Signing in…" : "Open my dashboard"}</span></button>
                </form>
              ) : (
                <form onSubmit={register} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Full name (as with ICAI)"><input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} className={inputCls} placeholder="Rajesh Sharma" required /></Field>
                    <Field label="ICAI membership number"><input value={reg.membershipNo} onChange={(e) => setReg({ ...reg, membershipNo: e.target.value })} inputMode="numeric" className={inputCls} placeholder="084920" required /></Field>
                    <Field label="Firm"><input value={reg.firmName} onChange={(e) => setReg({ ...reg, firmName: e.target.value })} className={inputCls} placeholder="Sharma & Associates" /></Field>
                    <Field label="City"><input value={reg.city} onChange={(e) => setReg({ ...reg, city: e.target.value })} className={inputCls} placeholder="New Delhi" /></Field>
                    <Field label="Email"><input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} className={inputCls} placeholder="you@firm.in" /></Field>
                    <Field label="Password"><input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} autoComplete="new-password" className={inputCls} required minLength={4} /></Field>
                  </div>
                  {authError && <ErrorLine text={authError} />}
                  <button type="submit" disabled={authBusy} className="btn-primary h-[48px] w-full rounded-[14px] text-[14.5px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"><Award size={16} /><span>{authBusy ? "Registering…" : "Register as a Wapsi certified CA"}</span></button>
                  <p className="text-[11.5px] text-ink-3 leading-relaxed">Wapsi certification is Wapsi's own mark: the account is checked against the membership number you give, and every change you make on a client's return is logged against it. It is not an ICAI credential.</p>
                </form>
              )}
            </div>
            <ClientCodeCard code={code} setCode={setCode} pin={pin} setPin={setPin} error={codeError} busy={codeBusy} onSubmit={openByCode} />
          </div>
        )}

        {/* ----------------------------------------------------- dashboard -- */}
        {me && !open && (
          <div className="space-y-6 py-2 animate-in fade-in">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div><h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Good to see you, {me.name.replace(/^CA\s+/, "").split(" ")[0]}.</h2><p className="text-[13.5px] text-ink-2 mt-1">{inbox.open.length === 0 ? "Nothing waiting right now — new requests appear here the moment a citizen asks for a certified review." : `${inbox.open.length} citizen${inbox.open.length === 1 ? " is" : "s are"} waiting for a certified CA. First to take one holds it.`}</p></div>
              <button type="button" onClick={() => void loadInbox()} className="glass-flat h-9 px-3 rounded-[12px] text-[12.5px] font-bold text-ink-2 flex items-center gap-1.5 cursor-pointer"><RefreshCw size={13} className={inboxBusy ? "animate-spin" : ""} />Refresh</button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[["Waiting for a CA", inbox.open.length, "text-money"], ["In my hands", inbox.mine.filter((r) => r.status === "claimed").length, "text-ink"], ["Sent back", inbox.mine.filter((r) => r.status === "reviewed" || r.status === "accepted" || r.status === "declined").length, "text-ok-ink"]].map(([l, n, c]) => (
                <div key={String(l)} className="glass rounded-[20px] px-5 py-4"><span className="block text-[11px] font-bold uppercase tracking-wider text-ink-3">{l}</span><span className={`font-mono text-[28px] font-extrabold tabular-nums ${c}`}>{n}</span></div>
              ))}
            </div>
            {claimError && <ErrorLine text={claimError} />}
            <section className="space-y-3">
              <h3 className="text-[15px] font-extrabold text-ink flex items-center gap-2"><Inbox size={16} className="text-money" />Incoming requests</h3>
              {inbox.open.length === 0 ? <p className="glass rounded-[20px] p-5 text-[13px] text-ink-3">The inbox is empty. Requests from every citizen who chooses "Get it verified by a Wapsi certified CA" arrive here.</p> : (
                <ul className="grid gap-3 md:grid-cols-2">{inbox.open.map((r) => <RequestCard key={r.code} r={r} lang={lang} cta="Take this return →" onOpen={() => void openFromInbox(r)} />)}</ul>
              )}
            </section>
            <section className="space-y-3">
              <h3 className="text-[15px] font-extrabold text-ink flex items-center gap-2"><UserRound size={16} className="text-money" />My reviews</h3>
              {inbox.mine.length === 0 ? <p className="glass rounded-[20px] p-5 text-[13px] text-ink-3">Nothing yet. A request you take shows here until it is sent back and the client decides.</p> : (
                <ul className="grid gap-3 md:grid-cols-2">{inbox.mine.map((r) => <RequestCard key={r.code} r={r} lang={lang} cta={r.status === "claimed" ? "Continue →" : "Open →"} onOpen={() => void openFromInbox(r)} />)}</ul>
              )}
            </section>
            <div className="max-w-[420px]"><ClientCodeCard code={code} setCode={setCode} pin={pin} setPin={setPin} error={codeError} busy={codeBusy} onSubmit={openByCode} compact /></div>
          </div>
        )}

        {/* ---------------------------------------------------- workspace -- */}
        {open && caPersona && originalB && caB && both && (
          <div className="space-y-5 animate-in fade-in duration-300 max-md:pb-24">
            <div className="sticky top-[64px] z-30 rounded-[20px] bg-paper/90 backdrop-blur-xl border border-glass-edge shadow-glass px-5 py-3.5 flex flex-wrap items-center gap-4 max-md:static">
              <button type="button" onClick={() => { setOpen(null); void loadInbox(); }} className="h-9 px-3 rounded-[12px] border border-glass-edge text-[12.5px] font-bold text-ink-2 flex items-center gap-1 cursor-pointer"><ChevronLeft size={14} />{me ? "Dashboard" : "Back"}</button>
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-[12px] ink-surface text-white grid place-items-center font-extrabold text-sm shrink-0">{open.review.citizenName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</div>
                <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h3 className="text-[15px] font-extrabold text-ink">{open.review.citizenName}</h3><span className="px-2 py-0.5 rounded-full bg-white/55 dark:bg-white/10 border border-glass-edge font-mono text-[11px] font-bold text-ink-2 tracking-wider">{open.review.citizenPan}</span><span className="px-2 py-0.5 rounded-full bg-amber-bg text-amber-ink text-[10.5px] font-bold">{(open.review as PublicReview).mode === "wapc" ? "Wapsi certified request" : "Shared by code"}</span></div><p className="text-[11.5px] text-ink-3 mt-0.5">{open.review.code} · {reviewStatusLabel(open.review as PublicReview)}</p></div>
              </div>
              <div className="ms-auto flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 rounded-[14px] bg-white/55 dark:bg-white/10 border border-glass-edge px-3.5 py-2">
                  <div><span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">Client filed</span><span className={`font-mono text-[14px] font-extrabold tabular-nums ${tone(originalB.refundOrDue)}`}>{position(originalB.refundOrDue)}</span></div>
                  <ArrowRight size={14} className="text-ink-3" />
                  <div><span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">Your version</span><span className={`font-mono text-[14px] font-extrabold tabular-nums ${tone(caB.refundOrDue)}`}>{position(caB.refundOrDue)}</span></div>
                </div>
                <button type="button" onClick={send} disabled={saving} className="btn-primary h-10 px-4 rounded-[14px] text-[13px] flex items-center gap-2 cursor-pointer disabled:opacity-60 max-md:hidden">{saved ? <><Check size={14} /><span>Sent to {firstName}</span></> : <><Save size={14} /><span>{saving ? "Sending…" : "Send my version to the client"}</span></>}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-[22px] items-start">
              <div className="space-y-4 min-w-0">
                {/* Who this is */}
                <section className="glass rounded-[24px] px-[22px] py-[18px] space-y-2">
                  <header className="flex items-baseline justify-between gap-3 flex-wrap"><h4 className="text-[15px] font-extrabold text-ink">Who you are reviewing</h4><span className="text-[11px] text-ink-3">from their papers and their own words</span></header>
                  <p className="text-[13.5px] text-ink leading-relaxed">{bg?.situation ?? `${open.review.originalPersona.occupation || "Taxpayer"}${open.review.originalPersona.city ? ` in ${open.review.originalPersona.city}` : ""}, age ${open.review.originalPersona.age}. Gross income ${formatMoney(originalB.grossIncome, lang)} on the ${open.review.originalRegime} regime.`}</p>
                  {(bg?.notes || open.review.clientNotes) && <p className="text-[13px] text-ink-2 italic border-s-2 border-money/50 ps-3">“{bg?.notes || open.review.clientNotes}”</p>}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {bg?.housing && <Chip>Housing: {bg.housing}</Chip>}{bg?.extras?.filter((x) => x !== "none").map((x) => <Chip key={x}>{x.replace(/_/g, " ")}</Chip>)}{bg?.employerCategory && <Chip>Employer: {bg.employerCategory.replace(/_/g, " ")}</Chip>}{bg?.filed && <Chip>Already filed</Chip>}
                    <Chip>{open.review.originalPersona.facts.length} income rows · {open.review.originalPersona.claims.length} claims · {open.review.originalPersona.taxPaid.length} tax credits</Chip>
                  </div>
                  <div className="pt-1"><CommentThread anchor="summary" label="the return overall" comments={comments.filter((c) => c.anchor === "summary")} active={activeAnchor === "summary"} canComment={open.viaAccount} draft={draft} setDraft={setDraft} onComment={postComment} onClose={() => toggleAnchor("summary")} />
                    {activeAnchor !== "summary" && <button type="button" onClick={() => toggleAnchor("summary")} className="text-[12px] font-bold text-money flex items-center gap-1 cursor-pointer"><MessageSquare size={12} />Comment on the return overall</button>}</div>
                </section>

                <Worksheet title="Income" meta="from AIS / Form 16 · editable" rows={incomeRows} totalLabel="Gross total income" total={caB.grossIncome} lang={lang} comments={comments} activeAnchor={activeAnchor} onToggleAnchor={toggleAnchor} onComment={postComment} canComment={open.viaAccount} draft={draft} setDraft={setDraft} />
                <Worksheet title="Deductions" meta={`Chapter VI-A · ${regime === "old" ? "count under the old regime" : "no effect under the new regime except 80CCD(2)"}`} rows={deductionRows} totalLabel="Total deductions" total={caB.totalDeductions} totalTone="text-ok-ink" lang={lang} comments={comments} activeAnchor={activeAnchor} onToggleAnchor={toggleAnchor} onComment={postComment} canComment={open.viaAccount} draft={draft} setDraft={setDraft} />
                <Worksheet title="Taxes already paid" meta="Form 26AS · TDS and advance tax" rows={taxRows} totalLabel="Credit against tax" total={caB.tdsCredits} lang={lang} comments={comments} activeAnchor={activeAnchor} onToggleAnchor={toggleAnchor} onComment={postComment} canComment={open.viaAccount} draft={draft} setDraft={setDraft} />

                <section className="glass rounded-[24px] px-[22px] py-[18px] space-y-3">
                  <header className="flex items-baseline justify-between gap-3 flex-wrap"><h4 className="text-[15px] font-extrabold text-ink">Note to the client</h4><span className="text-[11px] text-ink-3">{firstName} reads this word for word</span></header>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What you changed, what you checked, what they should have ready." className="w-full min-h-[84px] rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge p-3 text-[13px] text-ink focus:ring-2 focus:ring-money/40 focus:outline-none" />
                  {!me && <div className="grid sm:grid-cols-3 gap-2">{(["name", "membershipNo", "firmName"] as const).map((k) => <input key={k} value={stamp[k]} onChange={(e) => setStamp({ ...stamp, [k]: e.target.value })} placeholder={k === "name" ? "Your name" : k === "membershipNo" ? "ICAI number" : "Firm"} className={inputCls} />)}</div>}
                  <p className="text-[11.5px] text-ink-3">Stamp: {stamp.name || "—"}{stamp.membershipNo ? ` · #${stamp.membershipNo}` : ""}{stamp.firmName ? ` · ${stamp.firmName}` : ""}</p>
                </section>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-[148px]">
                <div className="md:contents max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:px-4 max-md:pb-7 max-md:pt-2.5 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)]">
                  <button type="button" onClick={send} disabled={saving} className="btn-primary md:hidden h-[50px] w-full rounded-[14px] text-[14.5px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">{saved ? <Check size={16} /> : <Save size={16} />}<span>{saved ? `Sent to ${firstName}` : saving ? "Sending…" : "Send my version"}</span></button>
                </div>
                <div className="ink-surface rounded-[24px] p-5 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-soft">Regime you recommend</span>
                  <div className="mt-3 grid grid-cols-2 gap-1 p-1 rounded-[12px] bg-white/10">{(["new", "old"] as const).map((r) => <button key={r} type="button" onClick={() => setRegime(r)} className={`h-8 rounded-[9px] text-[12.5px] font-bold cursor-pointer ${regime === r ? "bg-money text-white" : "text-white/75"}`}>{r === "new" ? "New" : "Old"}</button>)}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">{(["new", "old"] as const).map((r) => { const cheaper = both.new.totalTax <= both.old.totalTax ? "new" : "old"; return (
                    <div key={r} className={`rounded-[14px] p-3 border ${cheaper === r ? "border-money bg-white/[0.16]" : "border-white/10 bg-white/[0.08]"}`}><div className="flex items-center justify-between"><span className="text-[11.5px] font-bold">{r === "new" ? "New" : "Old"}</span>{cheaper === r && both.new.totalTax !== both.old.totalTax && <span className="px-1.5 py-0.5 rounded-full bg-amber-bg text-amber-ink text-[10px] font-extrabold">saves {formatMoney(Math.abs(both.new.totalTax - both.old.totalTax), lang)}</span>}</div><div className="mt-1 font-mono text-[18px] font-extrabold tabular-nums">{formatMoney(both[r].totalTax, lang)}</div><div className="text-[10.5px] text-white/60">tax</div></div>); })}</div>
                  <dl className="mt-4 space-y-1.5 text-[12.5px]">{([["Taxable income", caB.taxableIncome], ["Total tax", caB.totalTax], ["TDS already paid", caB.tdsCredits]] as const).map(([l, v]) => <div key={l} className="flex justify-between gap-3 text-white/80"><dt>{l}</dt><dd className="font-mono font-bold tabular-nums text-white">{formatMoney(v, lang)}</dd></div>)}</dl>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-baseline justify-between gap-3"><span className="text-[12.5px] font-bold text-white/80">{caB.refundOrDue < 0 ? "Balance due" : "Refund due"}</span><span className="font-mono text-[22px] font-extrabold tabular-nums text-[#5EE6B0]">{formatMoney(Math.abs(caB.refundOrDue), lang)}</span></div>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <CommentThread anchor="regime" label="the regime" comments={comments.filter((c) => c.anchor === "regime")} active={activeAnchor === "regime"} canComment={open.viaAccount} draft={draft} setDraft={setDraft} onComment={postComment} onClose={() => toggleAnchor("regime")} />
                    {activeAnchor !== "regime" && <button type="button" onClick={() => toggleAnchor("regime")} className="text-[12px] font-bold text-money flex items-center gap-1 cursor-pointer"><MessageSquare size={12} />Comment on the regime</button>}
                  </div>
                </div>
                <div className="glass rounded-[24px] p-5">
                  <h4 className="text-[15px] font-extrabold text-ink">Comments ({comments.length})</h4>
                  {comments.length === 0 ? <p className="mt-2 text-[12.5px] text-ink-3">Click the bubble on any line to leave one. The client sees it beside that line when they compare.</p> : (
                    <ul className="mt-2 space-y-2">{comments.map((c) => <li key={c.id} className="text-[12.5px]"><span className="font-mono text-[10.5px] text-money">{ANCHOR_LABELS[c.anchor] ?? c.anchor.replace(/^(income|deduction|taxPaid):/, "")}</span> <span className="text-ink">{c.text}</span></li>)}</ul>
                  )}
                </div>
                <p className="glass rounded-[24px] p-5 text-[12px] text-ink-2 flex items-start gap-2"><ShieldCheck size={14} className="text-money shrink-0 mt-0.5" />Client documents are read-only here. Every change and comment is logged against {me ? `membership #${me.membershipNo}` : "your stamp"}. The client decides which version to file; Wapsi shows them both with the engine's cross-checks.</p>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces -- */

const inputCls = "h-[44px] w-full rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-[13.5px] text-ink outline-none focus:border-money";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="block text-[12px] font-bold text-ink-2 mb-1">{label}</span>{children}</label>; }
function ErrorLine({ text }: { text: string }) { return <p role="alert" className="flex items-center gap-2 rounded-[14px] bg-bad-soft px-3.5 py-3 text-[13px] font-semibold text-bad"><AlertCircle size={16} className="shrink-0" /><span>{text}</span></p>; }
function Chip({ children }: { children: React.ReactNode }) { return <span className="glass-flat inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-2">{children}</span>; }

function RequestCard({ r, lang, cta, onOpen }: { r: PublicReview; lang: Lang; cta: string; onOpen: () => void }) {
  const b = computeForPersona(r.originalPersona, r.originalRegime);
  return (
    <li>
      <button type="button" onClick={onOpen} className="glass w-full text-start rounded-[20px] p-4 hover:border-money/50 transition cursor-pointer">
        <div className="flex items-center justify-between gap-2 flex-wrap"><span className="font-extrabold text-[14px] text-ink">{r.citizenName}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "pending" ? "bg-amber-bg text-amber-ink" : r.status === "claimed" || r.status === "declined" ? "bg-paper-2 text-ink-2 border border-line" : "bg-ok-soft text-ok-ink"}`}>{{ pending: "waiting", claimed: "in progress", reviewed: "sent back", accepted: "adopted by the client", declined: "client kept their version", rejected: "client kept their version" }[r.status]}</span></div>
        <p className="text-[12px] text-ink-2 mt-1 line-clamp-2">{r.background?.situation ?? `${r.originalPersona.occupation}${r.originalPersona.city ? `, ${r.originalPersona.city}` : ""}`}</p>
        {(r.background?.notes || r.clientNotes) && <p className="text-[11.5px] text-ink-3 italic mt-1 line-clamp-1">“{r.background?.notes || r.clientNotes}”</p>}
        <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px]"><span className="font-mono text-ink-3">{r.code} · {new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><span className={`font-mono font-bold ${b.refundOrDue >= 0 ? "text-ok-ink" : "text-bad"}`}>{b.refundOrDue >= 0 ? `refund ${formatMoney(b.refundOrDue, lang)}` : `${formatMoney(-b.refundOrDue, lang)} due`}</span></div>
        <span className="mt-2 inline-flex text-[12px] font-bold text-money">{cta}</span>
      </button>
    </li>
  );
}

function ClientCodeCard({ code, setCode, pin, setPin, error, busy, onSubmit, compact }: { code: string; setCode: (s: string) => void; pin: string; setPin: (s: string) => void; error: string | null; busy: boolean; onSubmit: (e: React.FormEvent) => void; compact?: boolean }) {
  return (
    <form onSubmit={onSubmit} className={`glass rounded-[24px] ${compact ? "p-5" : "px-5 py-6 sm:px-7 sm:py-7"} space-y-3`}>
      <div className="flex items-start gap-3"><Lock size={18} className="text-money shrink-0 mt-0.5" /><div><h3 className="text-[15px] font-extrabold text-ink">Have a client's code?</h3><p className="text-[12.5px] text-ink-2 mt-0.5">A citizen who chose “I have my own CA” shared an access code and a PIN. Open their return here — no account needed.</p></div></div>
      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CA-7842-91" autoCapitalize="characters" spellCheck={false} className="h-[46px] rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 font-mono text-[15px] font-semibold uppercase tracking-[.12em] text-ink outline-none focus:border-money" />
        <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" className="h-[46px] rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-center font-mono text-[15px] font-semibold tracking-[.12em] text-ink outline-none focus:border-money" />
      </div>
      {error && <ErrorLine text={error} />}
      <button type="submit" disabled={busy || !code.trim()} className="glass-flat h-[44px] w-full rounded-[14px] text-[13.5px] font-bold text-ink flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">{busy ? "Opening…" : "Open the client's return"}<ArrowRight size={14} /></button>
    </form>
  );
}

export default function CAPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-sm">Loading CA portal…</div>}>
      <CAPortalContent />
    </Suspense>
  );
}
