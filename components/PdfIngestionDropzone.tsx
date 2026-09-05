"use client";

/**
 * Drop a Form 16 or AIS PDF, and the figures come out of it.
 *
 * The parsing itself lives in lib/compliance/pdfExtract.ts — pure, byte-level
 * and testable without a DOM. Its limits (uncompressed text only; FlateDecode
 * and scans will not match) are documented there and stated on this surface
 * rather than buried, because a parser that quietly guesses at a tax document is
 * worse than one that admits it cannot read it.
 *
 * Nothing leaves the browser. The file is read with the File API and never
 * uploaded — worth saying out loud, because the document being dropped here is
 * one of the most sensitive a person has.
 */

import React, { useCallback, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { CheckCircle2, FileUp, Loader2, Lock, XCircle } from "lucide-react";
import { useTax } from "../context/TaxReturnContext";
import type { IngestedDocument } from "../context/TaxReturnContext";
import {
  detectDocumentKind,
  extractFieldsFromPdf,
  extractFieldsFromPdfBytes,
  isEmptyExtraction,
} from "../lib/compliance/pdfExtract";
import { Rupees } from "./Rupees";

export type { ExtractedFields } from "../lib/compliance/pdfExtract";
export { extractFieldsFromPdf, extractFieldsFromPdfBytes } from "../lib/compliance/pdfExtract";

const spring = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.7 };

type Phase = "idle" | "reading" | "ingested" | "empty" | "error";

interface PdfIngestionDropzoneProps {
  /**
   * Fired after the context has ingested the document, so a surface that
   * keeps its own ledger (the main journey) can write the same figures into it.
   */
  onIngested?: (document: IngestedDocument) => void;
}

export function PdfIngestionDropzone({ onIngested }: PdfIngestionDropzoneProps = {}) {
  const { dispatch } = useTax();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<IngestedDocument | null>(null);
  const [errorText, setErrorText] = useState<string>("");

  const handleFile = useCallback(
    async (file: File) => {
      setPhase("reading");
      setResult(null);
      setErrorText("");
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const extracted = await extractFieldsFromPdf(bytes);
        const kind = detectDocumentKind(bytes, file.name);

        // A visible parse beat. Instant completion on a document upload reads as
        // "nothing happened" and people re-drop the same file.
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const found = !isEmptyExtraction(extracted);

        if (!found) {
          setPhase("empty");
          return;
        }

        const document: IngestedDocument = {
          fileName: file.name,
          kind,
          ingestedAt: new Date().toISOString(),
          extracted,
        };
        dispatch({ type: "INGEST_DOCUMENT", document });
        onIngested?.(document);
        setResult(document);
        setPhase("ingested");
      } catch {
        setErrorText("That file could not be read. It may be corrupt or password-protected.");
        setPhase("error");
      }
    },
    [dispatch, onIngested],
  );

  return (
    <section className="space-y-3">
      <m.div
        layout
        transition={spring}
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? "border-teal-600 bg-teal-50 dark:bg-teal-950"
            : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        {/* A plain conditional, like the rest of the surface: the caption must
            never wait on an exit animation to finish. */}
        {phase === "reading" ? (
            <div
              key="reading"
              className="flex flex-col items-center gap-2 py-2"
              role="status"
            >
              <Loader2 size={24} className="animate-spin text-teal-700" />
              <p className="text-sm font-semibold text-slate-700">Reading your document…</p>
            </div>
          ) : (
            <div
              key="idle"
              className="flex flex-col items-center gap-2 py-2"
            >
              <FileUp size={24} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Drop your Form 16 or AIS PDF here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                or click to choose a file — PAN, gross salary and TDS are read out of it
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Lock size={11} /> Read in your browser. The file is never uploaded.
              </p>
            </div>
          )}
      </m.div>

      <AnimatePresence>
        {phase === "ingested" && result && (
          <m.div
            key="ok"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring}
            className="rounded-xl border border-emerald-300 bg-emerald-50 p-4"
            role="status"
          >
            <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-900">
              <CheckCircle2 size={15} />{" "}
              {result.kind === "AIS"
                ? "AIS Data Successfully Ingested"
                : "Form 16 Data Successfully Ingested"}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-emerald-900">
              {result.extracted.pan && (
                <li>
                  PAN <span className="font-mono font-bold">{result.extracted.pan}</span>
                </li>
              )}
              {result.extracted.grossSalary !== undefined && (
                <li>
                  Gross salary{" "}
                  <Rupees value={result.extracted.grossSalary} className="font-bold" />
                </li>
              )}
              {result.extracted.tds !== undefined && (
                <li>
                  Tax deducted <Rupees value={result.extracted.tds} className="font-bold" />
                </li>
              )}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-emerald-800">
              These update the <strong>reported</strong> side of each row. Any figure you
              have already confirmed or disputed is left exactly as you set it.
            </p>
          </m.div>
        )}

        {(phase === "empty" || phase === "error") && (
          <m.div
            key="fail"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring}
            className="rounded-xl border border-amber-300 bg-amber-50 p-4"
            role="status"
          >
            <p className="flex items-center gap-2 text-sm font-extrabold text-amber-900">
              <XCircle size={15} /> No figures could be read from that file
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-amber-900">
              {errorText ||
                "This reader only sees PDFs that store their text uncompressed. Most Form 16s are compressed and scanned copies have no text layer at all — in a production build this is where a real PDF text extractor belongs. Nothing was changed on your return."}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default PdfIngestionDropzone;
