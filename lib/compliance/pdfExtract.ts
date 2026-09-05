/**
 * Reading PAN, employee name, employer name, gross salary, and TDS out of a Form 16 / AIS PDF.
 *
 * Supported engines:
 * 1. Synchronous raw-byte regex scanner for uncompressed text streams.
 * 2. Async Web Stream FlateDecode decompressor (using native DecompressionStream)
 *    and /ToUnicode CMap character resolver for compressed PDFs (such as Chrome / Skia
 *    print-to-PDF or TRACES downloads).
 *
 * Pure client-side, zero server upload, browser & Node compliant.
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
export function detectDocumentKind(
  bytes: Uint8Array,
  fileName = "",
  extraText = "",
): DocumentKind {
  const text = decodeLatin1(bytes) + " " + extraText;
  if (/Annual Information Statement/i.test(text)) return "AIS";
  if (/FORM\s*NO\.?\s*16|Certificate under section 203/i.test(text)) return "FORM_16";
  return /ais/i.test(fileName) ? "AIS" : "FORM_16";
}

/**
 * The rupee sign, as it can actually turn up in a PDF's bytes.
 *
 * decodeLatin1 below is byte-for-byte by design, so a UTF-8 "₹" (E2 82 B9)
 * arrives as the three characters "â‚¹" and never equals a literal U+20B9
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
  name?: string;
  employerName?: string;
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

/** Pull the fields out of a PDF's raw bytes synchronously. Absent field = not found. */
export function extractFieldsFromPdfBytes(bytes: Uint8Array): ExtractedFields {
  const text = decodeLatin1(bytes);

  const pan = PAN_LABELLED_RE.exec(text)?.[1] ?? PAN_BOUNDED_RE.exec(text)?.[0];
  const grossSalaryRaw = GROSS_SALARY_RE.exec(text)?.[1];
  const tdsRaw = TDS_RE.exec(text)?.[1];

  const nameMatch = text.match(
    /(?:Name of (?:the )?Employee|Name of (?:the )?Deductee)[\s:]+([A-Za-z\s]{3,35})/i,
  );
  const employerMatch = text.match(
    /(?:Name of (?:the )?Employer|Name of (?:the )?Deductor)[\s:]+([A-Za-z\s.,&-]{3,50})/i,
  );

  return {
    pan,
    name: nameMatch ? nameMatch[1].replace(/\s+/g, " ").trim() : undefined,
    employerName: employerMatch ? employerMatch[1].replace(/\s+/g, " ").trim() : undefined,
    grossSalary: grossSalaryRaw ? parseIndianNumber(grossSalaryRaw) : undefined,
    tds: tdsRaw ? parseIndianNumber(tdsRaw) : undefined,
  };
}

/** True when the parser found nothing at all — the "we cannot read this" case. */
export function isEmptyExtraction(fields: ExtractedFields): boolean {
  return (
    fields.pan === undefined &&
    fields.name === undefined &&
    fields.grossSalary === undefined &&
    fields.tds === undefined
  );
}

/* -------------------------------------------------------------------------- */
/*                  DEFLATE DECOMPRESSION & CMAP RESOLUTION                   */
/* -------------------------------------------------------------------------- */

/**
 * A FlateDecode stream may inflate far beyond the 5 MB file that carried it; a
 * hostile PDF can inflate to gigabytes. Reading stops here (plan.md §4.3:
 * "also bound decompressed size, execution time, and extracted text").
 */
export const MAX_DECOMPRESSED_BYTES = 32 * 1024 * 1024;

async function decompressDeflateStream(rawBytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;

  for (const format of ["deflate", "deflate-raw"] as const) {
    try {
      const ds = new DecompressionStream(format);
      const writer = ds.writable.getWriter();
      writer.write(rawBytes as unknown as BufferSource);
      writer.close();

      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          total += value.length;
          if (total > MAX_DECOMPRESSED_BYTES) {
            await reader.cancel();
            return null;
          }
          chunks.push(value);
        }
      }

      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const out = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
      }
      return out;
    } catch {
      // try next format
    }
  }
  return null;
}

function parseCMap(text: string): Map<number, string> {
  const map = new Map<number, string>();

  // 1. bfrange: <start> <end> <dstStart>
  const bfrangeSectionRe = /beginbfrange\s*([\s\S]*?)\s*endbfrange/g;
  let sMatch;
  while ((sMatch = bfrangeSectionRe.exec(text)) !== null) {
    const sec = sMatch[1];
    const bfrangeRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let m;
    while ((m = bfrangeRe.exec(sec)) !== null) {
      const start = parseInt(m[1], 16);
      const end = parseInt(m[2], 16);
      const dstStart = parseInt(m[3], 16);
      for (let i = start; i <= end; i++) {
        map.set(i, String.fromCharCode(dstStart + (i - start)));
      }
    }
  }

  // 2. bfchar: <src> <dst>
  const bfcharSectionRe = /beginbfchar\s*([\s\S]*?)\s*endbfchar/g;
  while ((sMatch = bfcharSectionRe.exec(text)) !== null) {
    const sec = sMatch[1];
    const bfcharRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let m;
    while ((m = bfcharRe.exec(sec)) !== null) {
      map.set(parseInt(m[1], 16), String.fromCharCode(parseInt(m[2], 16)));
    }
  }

  return map;
}

/**
 * Enhanced async PDF extractor that handles both uncompressed text layers
 * and FlateDecode-compressed streams with /ToUnicode CMaps (e.g. Chrome Skia printouts).
 */
export async function extractFieldsFromPdf(bytes: Uint8Array): Promise<ExtractedFields> {
  // First attempt: synchronous raw byte scanner
  const syncFields = extractFieldsFromPdfBytes(bytes);
  if (
    syncFields.pan &&
    syncFields.name &&
    syncFields.grossSalary !== undefined &&
    syncFields.tds !== undefined
  ) {
    return syncFields;
  }

  // Second attempt: decompress FlateDecode streams
  const latin = decodeLatin1(bytes);
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  const decStreams: string[] = [];
  let sm;

  while ((sm = streamRegex.exec(latin)) !== null) {
    const rawChunk = new Uint8Array(sm[1].length);
    for (let i = 0; i < sm[1].length; i++) {
      rawChunk[i] = sm[1].charCodeAt(i) & 0xff;
    }

    const dec = await decompressDeflateStream(rawChunk);
    if (dec) {
      decStreams.push(decodeLatin1(dec));
    }
  }

  if (decStreams.length === 0) {
    return syncFields;
  }

  // Parse font CMaps
  const cmaps = decStreams.filter((s) => s.includes("begincmap")).map(parseCMap);

  // Decode all text in blocks
  const textLines: string[] = [];
  for (const s of decStreams) {
    if (!s.includes("Tj") && !s.includes("TJ")) continue;

    const btRe = /BT[\s\S]*?ET/g;
    let bm;
    while ((bm = btRe.exec(s)) !== null) {
      const block = bm[0];
      let lineText = "";

      const tokenRe = /<([0-9a-fA-F]{4,})>|\((.*?)\)/g;
      let tm;
      while ((tm = tokenRe.exec(block)) !== null) {
        if (tm[1]) {
          const hex = tm[1];
          let bestText = "";
          for (const cmap of cmaps) {
            let text = "";
            for (let i = 0; i < hex.length; i += 4) {
              const code = parseInt(hex.slice(i, i + 4), 16);
              const ch = cmap.get(code);
              if (ch) text += ch;
            }
            if (text.length > bestText.length) bestText = text;
          }
          lineText += bestText;
        } else if (tm[2]) {
          lineText += tm[2];
        }
      }

      if (lineText.trim()) {
        textLines.push(lineText.trim());
      }
    }
  }

  const fullText = textLines.join("\n");

  // 1. Employee Name
  let name = syncFields.name;
  if (!name) {
    const empNameMatch =
      fullText.match(
        /(?:Name of (?:the )?Employee|Name of (?:the )?Deductee)[\s:]+([A-Za-z\s]{3,35})/i,
      ) ||
      fullText.match(
        /Name[^\w\n]*\n\s*([A-Za-z\s]{3,35})\s*\n\s*(?:PAN|P AN)/i,
      );
    if (empNameMatch) {
      name = empNameMatch[1].replace(/\s+/g, " ").trim();
    }
  }

  // 2. Employer Name
  let employerName = syncFields.employerName;
  if (!employerName) {
    const emplyrMatch =
      fullText.match(
        /(?:Name of (?:the )?Employer|Name of (?:the )?Deductor)[\s:]+([A-Za-z\s.,&-]{3,50})/i,
      ) ||
      fullText.match(
        /Name[^\w\n]*\n\s*([A-Za-z\s.,&<-]{3,50})\s*\n\s*(?:TAN|T AN)/i,
      );
    if (emplyrMatch) {
      employerName = emplyrMatch[1].replace(/[<]/g, " ").replace(/\s+/g, " ").trim();
    }
  }

  // 3. PAN Extraction
  let pan = syncFields.pan;
  if (!pan) {
    const empMatch = fullText.match(
      /(?:Employee Details|Deductee)[\s\S]{0,250}?(?:PAN|P AN)[^\w]*([A-Z]{5}[0-9]{4}[A-Z])/i,
    );
    if (empMatch) {
      pan = empMatch[1];
    } else {
      const allPans = fullText.match(/[A-Z]{5}[0-9]{4}[A-Z]/g) || [];
      pan = allPans[0];
    }
  }

  // 4. Gross Salary Extraction
  let grossSalary = syncFields.grossSalary;
  if (grossSalary === undefined) {
    const salMatch = fullText.match(
      /(?:Salary\s*u\/s\s*17\(1\)|Total\s*Gross\s*Salary|Gross\s*Salary)[\s\S]{0,60}?([0-9]{1,3}(?:,[0-9]{2,3})+)/i,
    );
    if (salMatch) {
      grossSalary = parseIndianNumber(salMatch[1]);
    }
  }

  // 5. TDS Extraction
  let tds = syncFields.tds;
  if (tds === undefined) {
    const tdsMatch = fullText.match(
      /(?:Total\s*Tax\s*Deducted|TDS\s*Deducted|Tax\s*Deducted\s*at\s*Source|TDS)[^\d]{0,60}?([0-9]{1,3}(?:,[0-9]{2,3})+)/i,
    );
    if (tdsMatch) {
      tds = parseIndianNumber(tdsMatch[1]);
    }
  }

  return {
    pan,
    name,
    employerName,
    grossSalary,
    tds,
  };
}
