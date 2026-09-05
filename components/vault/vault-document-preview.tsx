"use client";

/**
 * The viewer behind the vault's "Open Document" link.
 *
 * WHY THIS IS A REPLICA AND NOT A FILE. A `VaultDocument` is metadata — id,
 * title, issuer, date, size — and there is no PDF anywhere behind it, because
 * nothing in this prototype ever contacted a deductor, TRACES or the
 * department. The link used to fire `alert("Viewing …")`, which is worse than
 * nothing: it implies a document exists. So the sheet is drawn from the
 * citizen's own vault figures, the same way ItrVReceipt draws the ITR-V, and it
 * says on its face that it is synthetic. `printable-sheet` is the shared class
 * that pins the paper white in both themes and makes window.print() emit the
 * sheet alone (see app/globals.css).
 *
 * Only figures the vault actually holds are printed. Where a real form would
 * carry something we do not have — savings interest on an AIS, say — the row is
 * absent rather than invented, so nothing here is a number a citizen could
 * mistake for one that was reported about them.
 */

import { Printer, X } from "lucide-react";
import { formatDate, formatMoney } from "../../lib/money";
import type { Lang } from "../../lib/types";
import type { CitizenVaultUser, VaultDocument } from "@/lib/vault/vault-store";

interface VaultDocumentPreviewProps {
  doc: VaultDocument | null;
  vaultUser: CitizenVaultUser;
  lang: Lang;
  onClose: () => void;
}

/**
 * A stable TAN-shaped identifier (AAAA12345A) for a deductor name. Same idiom
 * as the synthetic BSR code in lib/compliance/challan280.ts: seeded, so the
 * same employer always shows the same number, and invented, so it matches no
 * real deductor.
 */
function syntheticTan(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  // Unsigned shift throughout: `>>` is signed, and h routinely exceeds 2^31, so
  // `h >> 3` would go negative and index the alphabet off its start.
  const letter = (shift: number) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[(h >>> shift) % 26];
  return `${letter(0)}${letter(3)}${letter(6)}${letter(9)}${String(h % 100000).padStart(5, "0")}${letter(12)}`;
}

/** Four quarters that sum to exactly the year's deduction. */
function quarters(total: number): number[] {
  const q = Math.floor(total / 4);
  return [q, q, q, total - q * 3];
}

const QUARTER_LABELS = ["Q1 · Apr–Jun 2025", "Q2 · Jul–Sep 2025", "Q3 · Oct–Dec 2025", "Q4 · Jan–Mar 2026"];

const DOC_HEADINGS: Record<VaultDocument["docType"], { authority: string; title: string }> = {
  FORM_16: { authority: "Government of India — Income Tax Department", title: "FORM 16 (PARTS A & B)" },
  ANNUAL_INFO_STATEMENT: { authority: "Government of India — Income Tax Department", title: "ANNUAL INFORMATION STATEMENT (AIS)" },
  FORM_26AS: { authority: "TRACES · Centralised Processing Cell (TDS)", title: "FORM 26AS — TAX CREDIT STATEMENT" },
  BANK_STATEMENT: { authority: "Reporting financial institution", title: "BANK STATEMENT" },
  CHALLAN_280: { authority: "Government of India — Income Tax Department", title: "CHALLAN ITNS 280" },
  ITR_V: { authority: "Government of India — Income Tax Department", title: "FORM ITR-V (ACKNOWLEDGEMENT)" },
};

export default function VaultDocumentPreview({ doc, vaultUser, lang, onClose }: VaultDocumentPreviewProps) {
  if (!doc) return null;

  const heading = DOC_HEADINGS[doc.docType];
  const gross = vaultUser.stats?.salary ?? 0;
  const tds = vaultUser.stats?.tdsPaid ?? 0;
  const advanceTax = vaultUser.stats?.advanceTaxPaid ?? 0;
  // s.16(ia) is capped at the salary, exactly as lib/engine does it.
  const standardDeduction = Math.min(75000, gross);
  const taxable = Math.max(0, gross - standardDeduction);
  const tan = syntheticTan(doc.issuer);
  /* An AIS is published by CBDT and a 26AS by TRACES, but neither of them paid
     the salary — the deductor did. Naming the publisher as the source of the
     figure is exactly the provenance error this product exists to fix, so the
     payer is read off the Form 16 in the same vault. */
  const employer =
    vaultUser.documents.find((d) => d.docType === "FORM_16")?.issuer ?? "your employer";

  const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 ${strong ? "border-t border-gray-300 pt-2 font-bold" : ""}`}>
      <span className="text-gray-600">{label}</span>
      <span className="font-mono tabular-nums text-gray-900">{value}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-paper border border-line shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 print:hidden">
          <div className="min-w-0">
            <h3 className="font-sans text-sm font-bold text-ink truncate">{doc.title}</h3>
            <p className="font-mono text-[11px] text-ink-3">
              {doc.issuer} · {formatDate(doc.uploadedAt, lang)} · {doc.sizeKb} KB
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
            >
              <Printer size={13} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="size-8 rounded-lg border border-line text-ink-2 hover:text-ink flex items-center justify-center transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="printable-sheet rounded-xl border-2 border-gray-300 bg-white p-6 sm:p-8 font-sans text-gray-900 shadow-md print:rounded-none print:border-none print:p-0 print:shadow-none">
            {/* This banner prints. It is the first thing on the sheet by design. */}
            <p className="mb-4 rounded border border-amber-400 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Synthetic prototype document · not issued by any authority · no legal standing
            </p>

            <div className="border-b-2 border-gray-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                {heading.authority}
              </span>
              <h1 className="mt-0.5 text-lg font-extrabold text-gray-950">{heading.title}</h1>
              <p className="mt-1 text-xs text-gray-600">
                Assessment Year: <strong>{vaultUser.assessmentYear}</strong> | Financial Year:{" "}
                <strong>2025-26</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-gray-200 py-4 text-xs">
              <div>
                <p className="text-gray-500">Name of assessee:</p>
                <p className="text-sm font-bold uppercase text-gray-900">{vaultUser.fullName}</p>
                <p className="mt-2 text-gray-500">PAN:</p>
                <p className="font-mono text-sm font-bold text-gray-900">{vaultUser.pan}</p>
              </div>
              <div>
                <p className="text-gray-500">
                  {doc.docType === "FORM_16" ? "Deductor:" : "Information source:"}
                </p>
                <p className="text-sm font-bold text-gray-900">{doc.issuer}</p>
                <p className="mt-2 text-gray-500">
                  {doc.docType === "FORM_16" ? "TAN of deductor:" : "Statement generated:"}
                </p>
                <p className="font-mono text-sm font-bold text-gray-900">
                  {doc.docType === "FORM_16" ? tan : formatDate(doc.uploadedAt, lang)}
                </p>
              </div>
            </div>

            {doc.docType === "FORM_16" && (
              <>
                <section className="border-b border-gray-200 py-4 text-xs">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                    Part A — tax deducted and deposited, quarter by quarter
                  </h4>
                  {quarters(tds).map((amount, i) => (
                    <Row key={QUARTER_LABELS[i]} label={QUARTER_LABELS[i]} value={formatMoney(amount, lang)} />
                  ))}
                  <Row label="Total deducted for the year" value={formatMoney(tds, lang)} strong />
                </section>

                <section className="py-4 text-xs">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                    Part B — computation of salary income
                  </h4>
                  <Row label="Gross salary u/s 17(1)" value={formatMoney(gross, lang)} />
                  <Row
                    label="Less: standard deduction u/s 16(ia)"
                    value={`− ${formatMoney(standardDeduction, lang)}`}
                  />
                  <Row label="Income chargeable under the head Salaries" value={formatMoney(taxable, lang)} strong />
                </section>
              </>
            )}

            {doc.docType === "ANNUAL_INFO_STATEMENT" && (
              <section className="py-4 text-xs">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                  Information reported about you for the year
                </h4>
                <Row label={`Salary received — ${employer}`} value={formatMoney(gross, lang)} />
                <Row label="Tax deducted at source on salary (s.192)" value={formatMoney(tds, lang)} />
                {advanceTax > 0 && <Row label="Advance tax paid" value={formatMoney(advanceTax, lang)} />}
                <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                  Each line above is a figure someone else reported about you. Confirm what is right
                  and correct what is not — an AIS entry can only be fixed by the party that filed it.
                </p>
              </section>
            )}

            {doc.docType === "FORM_26AS" && (
              <section className="py-4 text-xs">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                  Part A — tax deducted at source
                </h4>
                <div className="flex items-baseline justify-between gap-4 border-b border-gray-300 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>Deductor · section</span>
                  <span>Credited</span>
                </div>
                <Row label={`${employer} · s.192`} value={formatMoney(tds, lang)} />
                {advanceTax > 0 && <Row label="Self · advance tax, s.208" value={formatMoney(advanceTax, lang)} />}
                <Row label="Total credit available" value={formatMoney(tds + advanceTax, lang)} strong />
              </section>
            )}

            {!["FORM_16", "ANNUAL_INFO_STATEMENT", "FORM_26AS"].includes(doc.docType) && (
              <section className="py-4 text-xs">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                  Document summary
                </h4>
                <Row label="Document type" value={doc.docType.replace(/_/g, " ")} />
                <Row label="Status" value={doc.status.toUpperCase()} />
                <Row label="Stored on" value={formatDate(doc.uploadedAt, lang)} />
              </section>
            )}

            <p className="mt-4 border-t border-gray-200 pt-3 text-[10px] leading-relaxed text-gray-500">
              Drawn from the figures held in your vault for {vaultUser.pan}. No deductor, bank,
              TRACES or department system was contacted to produce it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
