"use client";

/**
 * The manual-mode tool views (plan task 4.2–4.4): a drawer over the dashboard holding the
 * calculator, the regime comparison, the advance-tax schedule, the HRA check, the
 * capital-gains helper, the calendar, the TDS check, mock e-verification and filing
 * history. Every figure comes from lib/engine or lib/tools; nothing here does arithmetic.
 */
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { compareRegimes, computeTax } from "@/lib/engine/tax";
import type { TaxBreakdown, TaxInput } from "@/lib/engine/types";
import type { Claim, Persona } from "@/lib/types";
import type { Lang } from "@/lib/types";
import { advanceTaxSchedule, calendarWithStatus, hraExemption, tdsMismatch } from "@/lib/tools";
import { formatMoney } from "@/lib/money";
import { localize } from "@/components/mock-i18n";

export type ToolId = "calculator" | "compare" | "advance_tax" | "hra" | "capital_gains" | "calendar" | "tds_check" | "everify" | "history";

const TITLES: Record<ToolId, string> = {
  calculator: "Tax calculator",
  compare: "Tax & Regime Optimizer",
  advance_tax: "Advance-tax dates",
  hra: "Rent allowance check",
  capital_gains: "Shares or property sold?",
  calendar: "Tax Calendar & Deadlines",
  tds_check: "Does my TDS match?",
  everify: "e-Verify my return",
  history: "Return Status & Past Filings",
};

const TODAY = new Date().toISOString().slice(0, 10);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full min-h-10 rounded-xl border border-line bg-paper px-3 font-mono text-sm text-ink outline-none focus:border-money";

function Money({ value, onChange, placeholder = "0" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-sm text-ink-3">₹</span>
      <input inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))} className={`${inputClass} pl-7`} placeholder={placeholder} />
    </div>
  );
}

const n = (v: string) => Number(v) || 0;

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-line rounded-xl border border-line bg-paper-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 px-3 py-2">
          <dt className="text-sm text-ink-2">{k}</dt>
          <dd className="font-mono text-sm tabular-nums text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function breakdownRows(b: TaxBreakdown): [string, string][] {
  return [
    ["Income before deductions", formatMoney(b.grossIncome)],
    ["Standard deduction", `− ${formatMoney(b.standardDeduction)}`],
    ["Other deductions allowed", `− ${formatMoney(b.totalDeductions)}`],
    ["Income that is taxed", formatMoney(b.taxableIncome)],
    ["Tax before rebate", formatMoney(b.taxBeforeRebate)],
    ["Rebate", `− ${formatMoney(b.rebate87A)}`],
    ["Cess (4%)", formatMoney(b.cess)],
    ["Tax for the year", formatMoney(b.totalTax)],
    ["Already paid", formatMoney(b.tdsCredits)],
    [b.refundOrDue >= 0 ? "Coming back to you" : "Still to pay", formatMoney(Math.abs(b.refundOrDue))],
  ];
}

function inputFrom(f: { salary: string; other: string; interest: string; c80: string; d80: string; tds: string }, regime: "new" | "old"): TaxInput {
  const claims: Claim[] = [];
  if (n(f.c80)) claims.push({ id: "c80", section: "80C", amount: n(f.c80), label: "80C", evidenceAttached: false });
  if (n(f.d80)) claims.push({ id: "d80", section: "80D_SELF", amount: n(f.d80), label: "80D", evidenceAttached: false });
  return {
    facts: [
      ...(n(f.salary) ? [{ kind: "salary" as const, amount: n(f.salary) }] : []),
      ...(n(f.other) ? [{ kind: "other" as const, amount: n(f.other) }] : []),
      ...(n(f.interest) ? [{ kind: "interest" as const, amount: n(f.interest) }] : []),
    ],
    claims,
    regime,
    tdsCredits: n(f.tds),
  };
}

function useFigures(persona: Persona | null) {
  const salary = persona?.facts.filter((f) => f.kind === "salary").reduce((a, f) => a + f.amount, 0) ?? 0;
  const interest = persona?.facts.filter((f) => f.kind === "interest").reduce((a, f) => a + f.amount, 0) ?? 0;
  const tds = persona?.taxPaid.reduce((a, p) => a + p.amount, 0) ?? 0;
  const c80 = persona?.claims.filter((c) => c.section === "80C").reduce((a, c) => a + c.amount, 0) ?? 0;
  const d80 = persona?.claims.filter((c) => c.section === "80D_SELF").reduce((a, c) => a + c.amount, 0) ?? 0;
  return useState({ salary: salary ? String(salary) : "", other: "", interest: interest ? String(interest) : "", c80: c80 ? String(c80) : "", d80: d80 ? String(d80) : "", tds: tds ? String(tds) : "" });
}

function FiguresForm({ f, set }: { f: ReturnType<typeof useFigures>[0]; set: ReturnType<typeof useFigures>[1] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Salary for the year"><Money value={f.salary} onChange={(v) => set({ ...f, salary: v })} /></Field>
      <Field label="Freelance or business income"><Money value={f.other} onChange={(v) => set({ ...f, other: v })} /></Field>
      <Field label="Bank interest"><Money value={f.interest} onChange={(v) => set({ ...f, interest: v })} /></Field>
      <Field label="Tax already deducted"><Money value={f.tds} onChange={(v) => set({ ...f, tds: v })} /></Field>
      <Field label="PF, ELSS, insurance premiums (80C)"><Money value={f.c80} onChange={(v) => set({ ...f, c80: v })} /></Field>
      <Field label="Health insurance (80D)"><Money value={f.d80} onChange={(v) => set({ ...f, d80: v })} /></Field>
    </div>
  );
}

function CalculatorTool({ persona }: { persona: Persona | null }) {
  const [f, set] = useFigures(persona);
  const [regime, setRegime] = useState<"new" | "old">("new");
  const b = computeTax(inputFrom(f, regime));
  return (
    <div className="space-y-4">
      <FiguresForm f={f} set={set} />
      <div className="seg w-fit" role="group" aria-label="Regime">
        {(["new", "old"] as const).map((r) => (
          <button key={r} type="button" aria-pressed={regime === r} onClick={() => setRegime(r)} className="min-h-[40px] px-4">
            {r === "new" ? "New regime" : "Old regime"}
          </button>
        ))}
      </div>
      <Rows rows={breakdownRows(b)} />
    </div>
  );
}

function CompareTool({ persona }: { persona: Persona | null }) {
  const [f, set] = useFigures(persona);
  const both = compareRegimes(inputFrom(f, "new"));
  const cheaper = both.new.totalTax <= both.old.totalTax ? "new" : "old";
  return (
    <div className="space-y-4">
      <FiguresForm f={f} set={set} />
      <div className="grid gap-3 sm:grid-cols-2">
        {(["new", "old"] as const).map((r) => (
          <div key={r} className={`rounded-xl border p-4 ${cheaper === r ? "border-money bg-money-soft" : "border-line bg-paper-2"}`} data-testid={`compare-${r}`}>
            <p className="text-xs font-mono uppercase tracking-wider text-ink-3">{r} regime</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{formatMoney(both[r].totalTax)}</p>
            <p className="text-xs text-ink-2">deductions allowed {formatMoney(both[r].totalDeductions + both[r].standardDeduction)}</p>
            {cheaper === r && <p className="mt-2 text-xs font-semibold text-money">Cheaper by {formatMoney(Math.abs(both.new.totalTax - both.old.totalTax))}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvanceTaxTool() {
  const [liability, setLiability] = useState("");
  const [presumptive, setPresumptive] = useState(false);
  const schedule = advanceTaxSchedule(n(liability), { presumptive });
  return (
    <div className="space-y-4">
      <Field label="Tax you expect to owe this year after TDS"><Money value={liability} onChange={setLiability} /></Field>
      <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={presumptive} onChange={(e) => setPresumptive(e.target.checked)} /> I declare income under the presumptive scheme (44AD / 44ADA)</label>
      {!schedule.applies ? (
        <p className="text-sm text-ink-2">Below ₹10,000 there is nothing to pay in advance; the balance goes with the return.</p>
      ) : (
        <Rows rows={schedule.instalments.map((i) => [i.label, `${formatMoney(i.instalment)} (${Math.round(i.cumulativeShare * 100)}% so far)`])} />
      )}
    </div>
  );
}

function HraTool() {
  const [f, set] = useState({ basic: "", hra: "", rent: "", metro: true });
  const r = hraExemption({ basic: n(f.basic), hraReceived: n(f.hra), rentPaid: n(f.rent), metro: f.metro });
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Basic salary for the year"><Money value={f.basic} onChange={(v) => set({ ...f, basic: v })} /></Field>
        <Field label="Rent allowance received"><Money value={f.hra} onChange={(v) => set({ ...f, hra: v })} /></Field>
        <Field label="Rent you paid"><Money value={f.rent} onChange={(v) => set({ ...f, rent: v })} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={f.metro} onChange={(e) => set({ ...f, metro: e.target.checked })} /> I live in Delhi, Mumbai, Kolkata or Chennai</label>
      <Rows
        rows={[
          ["Allowance received", formatMoney(r.limits.received)],
          ["Rent minus 10% of basic", formatMoney(r.limits.rentMinusTenPercent)],
          [`${f.metro ? "50" : "40"}% of basic`, formatMoney(r.limits.percentOfBasic)],
          ["Tax-free part (the least of the three)", formatMoney(r.exempt)],
          ["Taxed part", formatMoney(r.taxable)],
        ]}
      />
      <p className="text-xs text-ink-3">Only the old regime allows this; the new regime taxes the whole allowance.</p>
    </div>
  );
}

function CapitalGainsTool() {
  const [f, set] = useState({ gain: "", asset: "equity_stt" as "equity_stt" | "other", holding: "long" as "short" | "long", otherIncome: "" });
  const b = computeTax({
    facts: [
      ...(n(f.otherIncome) ? [{ kind: "salary" as const, amount: n(f.otherIncome) }] : []),
      ...(n(f.gain) ? [{ kind: "capital_gains" as const, amount: n(f.gain), capitalGains: { assetClass: f.asset, holding: f.holding } }] : []),
    ],
    claims: [],
    regime: "new",
  });
  const special = b.specialRate[0];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Gain on the sale"><Money value={f.gain} onChange={(v) => set({ ...f, gain: v })} /></Field>
        <Field label="What was sold">
          <select value={f.asset} onChange={(e) => set({ ...f, asset: e.target.value as "equity_stt" | "other" })} className={inputClass}>
            <option value="equity_stt">Listed shares or equity funds</option>
            <option value="other">Property, gold, debt funds, anything else</option>
          </select>
        </Field>
        <Field label="Held for">
          <select value={f.holding} onChange={(e) => set({ ...f, holding: e.target.value as "short" | "long" })} className={inputClass}>
            <option value="short">Under a year (shares) / under two years (property)</option>
            <option value="long">Longer than that</option>
          </select>
        </Field>
      </div>
      <Field label="Your other income this year (salary etc.)"><Money value={f.otherIncome} onChange={(v) => set({ ...f, otherIncome: v })} /></Field>
      <Rows
        rows={[
          ["Rate that applies", special ? `${Math.round(special.rate * 100)}% (section ${special.section})` : "Normal slab rates"],
          ["Exempt part", formatMoney(b.specialExemptTotal)],
          ["Tax on the gain", formatMoney(special?.tax ?? 0)],
          ["Total tax for the year", formatMoney(b.totalTax)],
        ]}
      />
      <p className="text-xs text-ink-3">Listed shares held over a year: the first ₹1,25,000 of gain each year is tax-free, then 12.5%. Under a year: 20%. Other assets held long: 12.5%.</p>
    </div>
  );
}

function CalendarTool() {
  const entries = calendarWithStatus(TODAY);
  return (
    <ol className="space-y-2">
      {entries.map((e) => (
        <li key={e.date} className={`flex gap-3 rounded-xl border px-3 py-2 ${e.status === "soon" ? "border-warn bg-warn-soft" : "border-line bg-paper-2"} ${e.status === "past" ? "opacity-60" : ""}`}>
          <span className="w-24 shrink-0 font-mono text-xs text-ink-2">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          <div>
            <p className="text-sm font-semibold text-ink">{e.title}</p>
            <p className="text-xs text-ink-2">{e.detail}</p>
            <p className="text-[0.68rem] font-mono text-ink-3">{e.status === "past" ? "passed" : e.status === "soon" ? `in ${e.daysAway} days` : `${e.daysAway} days away`} · {e.audience}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function TdsCheckTool({ persona }: { persona: Persona | null }) {
  const statement = persona?.taxPaid.reduce((a, p) => a + p.amount, 0) ?? 0;
  const [f, set] = useState({ form16: "", statement: statement ? String(statement) : "" });
  const r = tdsMismatch(n(f.form16), n(f.statement));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tax deducted, as your Form 16 says"><Money value={f.form16} onChange={(v) => set({ ...f, form16: v })} /></Field>
        <Field label="Tax deducted, as the department's statement says"><Money value={f.statement} onChange={(v) => set({ ...f, statement: v })} /></Field>
      </div>
      <div className={`rounded-xl border p-4 ${r.direction === "match" ? "border-money bg-money-soft" : "border-warn bg-warn-soft"}`} data-testid="tds-result">
        <p className="font-mono text-sm">{r.direction === "match" ? "They match" : `Difference ${formatMoney(Math.abs(r.difference))}`}</p>
        <p className="mt-1 text-sm text-ink-2">{r.advice}</p>
      </div>
    </div>
  );
}

interface FiledSummary {
  ackNumber: string;
  filedAt: string;
  form: string;
  regime: string;
  refundOrDue: number;
  totalTax: number;
  everifiedAt: string | null;
  everifyBy: string;
}

function useFiled() {
  const [filed, setFiled] = useState<FiledSummary | null | undefined>(undefined);
  const reload = () => fetch("/api/returns").then((r) => r.json()).then((b: { filed: FiledSummary | null }) => setFiled(b.filed)).catch(() => setFiled(null));
  useEffect(() => {
    void reload();
  }, []);
  return { filed, reload };
}

function EverifyTool() {
  const { filed, reload } = useFiled();
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/returns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const body = (await res.json()) as { everifiedAt?: string; message?: string };
    setNote(res.ok ? "Verified. The return is now complete; the refund tracker starts moving." : (body.message ?? "Could not verify."));
    if (res.ok) void reload();
  };
  if (filed === undefined) return <p className="text-sm text-ink-3">Loading…</p>;
  if (!filed) return <p className="text-sm text-ink-2">No return has been filed from this account yet. File one (here or with the assistant) and come back within 30 days.</p>;
  return (
    <div className="space-y-4">
      <Rows rows={[["Acknowledgement", filed.ackNumber], ["Filed", new Date(filed.filedAt).toLocaleString("en-IN")], ["Verify by", filed.everifyBy], ["Status", filed.everifiedAt ? `Verified ${new Date(filed.everifiedAt).toLocaleString("en-IN")}` : "Not yet verified"]]} />
      {!filed.everifiedAt && (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="One-time code sent to your Aadhaar-linked mobile (mock: 949494)">
            <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={inputClass} data-testid="everify-code" />
          </Field>
          <button type="submit" disabled={code.length !== 6} className="min-h-10 rounded-xl bg-navy px-5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50" data-testid="everify-submit">
            Verify
          </button>
        </form>
      )}
      {note && <p role="status" className="text-sm text-ink">{note}</p>}
      <p className="text-xs text-ink-3">A return that is not verified within 30 days is treated as never filed. Nothing here contacts UIDAI.</p>
    </div>
  );
}

function HistoryTool() {
  const { filed } = useFiled();
  const [runs, setRuns] = useState<{ id: string; title: string; taskId: string | null; status: string; updatedAt: string }[]>([]);
  useEffect(() => {
    fetch("/api/runs").then((r) => r.json()).then((b: { runs?: typeof runs }) => setRuns(b.runs ?? [])).catch(() => setRuns([]));
  }, []);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">Returns</p>
        {filed ? (
          <Rows rows={[["Assessment year", "2026-27"], ["Form", filed.form], ["Acknowledgement", filed.ackNumber], ["Filed", new Date(filed.filedAt).toLocaleString("en-IN")], ["Regime", filed.regime], ["Tax", formatMoney(filed.totalTax)], [filed.refundOrDue >= 0 ? "Refund" : "Payable", formatMoney(Math.abs(filed.refundOrDue))], ["e-Verified", filed.everifiedAt ? "yes" : "not yet"]]} />
        ) : (
          <p className="mt-1 text-sm text-ink-3">{filed === undefined ? "Loading…" : "Nothing filed from this account yet."}</p>
        )}
      </div>
      <div>
        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">Chats with the assistant</p>
        {runs.length === 0 ? (
          <p className="mt-1 text-sm text-ink-3">None yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-line rounded-xl border border-line bg-paper-2">
            {runs.map((run) => (
              <li key={run.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-ink">{run.title}</span>
                <span className="font-mono text-xs text-ink-3">{run.taskId ?? "—"} · {run.status} · {new Date(run.updatedAt).toLocaleDateString("en-IN")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ToolDrawer({ tool, lang, onClose, persona }: { tool: ToolId | null; lang: Lang; onClose: () => void; persona: Persona | null }) {
  useEffect(() => {
    if (!tool) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, onClose]);
  if (!tool) return null;
  const L = (s: string) => localize(s, lang);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 sm:items-center" onClick={onClose} role="presentation">
      <div className="surface-panel max-h-[90dvh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="tool-title" data-testid="tool-drawer" data-tool={tool}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="tool-title" className="text-lg font-bold text-ink">{L(TITLES[tool])}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-2 hover:bg-paper-2">
            <X size={18} />
          </button>
        </div>
        {tool === "calculator" && <CalculatorTool persona={persona} />}
        {tool === "compare" && <CompareTool persona={persona} />}
        {tool === "advance_tax" && <AdvanceTaxTool />}
        {tool === "hra" && <HraTool />}
        {tool === "capital_gains" && <CapitalGainsTool />}
        {tool === "calendar" && (
          <div className="space-y-6">
            <CalendarTool />
            <section className="space-y-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">{L("Advance-tax instalments")}</h3>
              <AdvanceTaxTool />
            </section>
          </div>
        )}
        {tool === "tds_check" && <TdsCheckTool persona={persona} />}
        {tool === "everify" && <EverifyTool />}
        {tool === "history" && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">{L("e-Verify (within 30 days of filing)")}</h3>
              <EverifyTool />
            </section>
            <HistoryTool />
          </div>
        )}
      </div>
    </div>
  );
}
