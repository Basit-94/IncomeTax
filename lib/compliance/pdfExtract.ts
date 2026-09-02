/**
 * Reading PAN, gross salary and TDS out of a Form 16 / AIS PDF.
 *
 * WHY REGEX AND NOT pdf.js. This is a deliberate trade, and the cost is real:
 * pdf.js is ~2 MB plus a worker, and this surface demonstrates the ingest step
 * rather than being a production document pipeline. The consequence is that only
 * PDFs storing their text uncompressed will match. Most real Form 16s use
 * FlateDecode streams and a scanned one has no text layer at all — so this
 * returns nothing for them, and the UI says so plainly instead of inventing
 * figures. That honesty is the point: a parser that guesses at a tax document is
 * worse than one that admits it cannot read it.
 *
 * Pure, synchronous, no DOM and no React, so it can be tested directly on bytes.
 */

/** Structural PAN format: five letters, four digits, one letter. */
export const PAN_RE = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;

/**
 * The PAN as it is actually labelled on a Form 16 / AIS. Tried first: a raw
 * PDF byte stream is full of upper-case runs that happen to fit the structural
 * pattern, and a false match here would silently rewrite the return's PAN.
 */
const PAN_LABELLED_RE =
  /(?:PAN of the (?:Deductee|Employee|Assessee)|Permanent Account (?:No\.?|Number)|PAN)[^A-Z0-9]{0,40}([A-Z]{5}[0-9]{4}[A-Z])(?![A-Z0-9])/;

/** The structural fallback, bounded so it cannot start or end mid-run. */
const PAN_BOUNDED_RE = /(?<![A-Z0-9])[A-Z]{5}[0-9]{4}[A-Z](?![A-Z0-9])/;

export type DocumentKind = "FORM_16" | "AIS";

/**
 * What the document says it is, from its own text; the file name is only a
 * fallback. A Form 16 says so in its heading (and cites s.203); an AIS says
 * "Annual Information Statement".
 */
export function detectDocumentKind(bytes: Uint8Array, fileName = ""): DocumentKind {
  const text = decodeLatin1(bytes);
  if (/Annual Information Statement/i.test(text)) return "AIS";
  if (/FORM\s*NO\.?\s*16|Certificate under section 203/i.test(text)) return "FORM_16";
  return /ais/i.test(fileName) ? "AIS" : "FORM_16";
}

/**
 * The rupee sign, as it can actually turn up in a PDF's bytes.
 *
 * decodeLatin1 below is byte-for-byte by design, so a UTF-8 "₹" (E2 82 B9)
 * arrives as the three characters "â¹" and never equals a literal U+20B9
 * in a pattern. Matching only the literal would mean any document that spells
 * the amount with the symbol reads as unparseable — the one case the symbol is
 * there to make clearer. Both spellings are accepted, plus "Rs"/"Rs.".
 */
const RUPEE_SIGN = "(?:₹|\\u00e2\\u0082\\u00b9|Rs\\.?)?";

export const GROSS_SALARY_RE = new RegExp(
  `(?:Gross Salary|Salary u/s 17\\(1\\))[\\s:]+${RUPEE_SIGN}\\s*([0-9,]+)`,
  "i",
);

export const TDS_RE = new RegExp(
  `(?:Total Tax Deducted|TDS)[\\s:]+${RUPEE_SIGN}\\s*([0-9,]+)`,
  "i",
);

export interface ExtractedFields {
  pan?: string;
  grossSalary?: number;
  tds?: number;
}

/** "12,50,000" → 1250000. Returns undefined rather than NaN on junk. */
export function parseIndianNumber(raw: string): number | undefined {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

/**
 * Decode bytes as Latin-1.
 *
 * Not UTF-8: PDF content streams are byte-oriented, and decoding as UTF-8 turns
 * any byte above 0x7F into a replacement character, which breaks a match that
 * straddles one. Chunked so a large file does not blow the argument limit.
 */
export function decodeLatin1(bytes: Uint8Array): string {
  let text = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    text += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return text;
}

/** Pull the three fields out of a PDF's raw bytes. Absent field = not found. */
export function extractFieldsFromPdfBytes(bytes: Uint8Array): ExtractedFields {
  const text = decodeLatin1(bytes);

  const pan = PAN_LABELLED_RE.exec(text)?.[1] ?? PAN_BOUNDED_RE.exec(text)?.[0];
  const grossSalaryRaw = GROSS_SALARY_RE.exec(text)?.[1];
  const tdsRaw = TDS_RE.exec(text)?.[1];

  return {
    pan,
    grossSalary: grossSalaryRaw ? parseIndianNumber(grossSalaryRaw) : undefined,
    tds: tdsRaw ? parseIndianNumber(tdsRaw) : undefined,
  };
}

/** True when the parser found nothing at all — the "we cannot read this" case. */
export function isEmptyExtraction(fields: ExtractedFields): boolean {
  return (
    fields.pan === undefined &&
    fields.grossSalary === undefined &&
    fields.tds === undefined
  );
}
