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
  `(?:Gross Total Income|Total Gross Salary|Gross Salary|Salary u/s 17\\(1\\)|Taxable Salary|Income from Salary|Gross Amount)[\\s:]+${RUPEE_SIGN}\\s*([0-9,]+)`,
  "i",
);

export const TDS_RE = new RegExp(
  // "Total Tax Deducted at Source (TDS) 1,24,000" — the bracketed spelling on the 2026-09-07 mock PDFs — is tried first.
  `(?:Total Tax Deducted at Source \\(TDS\\)|Total Tax Deducted|Tax Deducted at Source|Total Tax Deposited|Total TDS|TDS Deducted|TDS)[\\s:]+${RUPEE_SIGN}\\s*([0-9,]+)`,
  "i",
);

export interface ExtractedFields {
  pan?: string;
  name?: string;
  employerName?: string;
  grossSalary?: number;
  tds?: number;
  /**
   * The richer rows a Form 16 Part B / AIS carries (2026-09-07). The PDF parser does not read these yet
   * (Phase B); the DigiLocker mock issues them so the yearly intake can skip what the papers answer.
   */
  tan?: string;
  dob?: string;
  professionalTax?: number;
  /** Allowances exempt u/s 10, one row each — HRA 10(13A), LTA 10(5), gratuity 10(10)… */
  exemptAllowances?: { section: string; amount: number }[];
  /** Chapter VI-A the employer already reported — 80CCD(2) in both regimes; 80C/80D under the old. */
  employerClaims?: { section: string; amount: number }[];
  /** AIS: interest, dividends and listed-equity LTCG, with the reporter so provenance survives. */
  otherIncome?: { kind: "interest" | "dividend"; label: string; amount: number; reporter: string; identifier?: string; section?: string }[];
  ltcg112A?: { sale: number; cost: number; gain: number; reporter: string };
  /** AIS: TDS by anyone other than the employer (194A on deposits, 194 on dividends…). */
  tdsOther?: { section: string; reporter: string; amount: number }[];
  /** Form 16 Part B rows 1(a)–(c). */
  salaryParts?: { s17_1?: number; s17_2?: number; s17_3?: number };
  /** Part B since FY 2023-24: "Whether opting out of taxation u/s 115BAC(1A)?" — true means the old regime. */
  regimeOptOut?: boolean;
  /** Which of the optional rows the parser actually found, so the interface can say what was read (Phase B). */
  readFields?: string[];
}

/* ------------------------------------------------------- Phase B: the rows -- */

const AMOUNT = `${RUPEE_SIGN}\\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{4,9})(?![0-9,])`;
const sameLine = (label: string) => new RegExp(`(?:${label})[^\\n]{0,90}?${AMOUNT}`, "i");

function grabAmount(text: string, label: string): number | undefined {
  const m = sameLine(label).exec(text);
  return m ? parseIndianNumber(m[1]) : undefined;
}

const EXEMPTIONS: [string, string][] = [
  ["10(13A)", "House rent allowance|HRA[^\\n]{0,20}10\\(13A\\)|10\\(13A\\)"],
  ["10(5)", "Travel concession|Leave travel|LTA[^\\n]{0,20}10\\(5\\)|10\\(5\\)"],
  ["10(10)", "Death-cum-retirement gratuity|Gratuity[^\\n]{0,20}10\\(10\\)"],
  ["10(10A)", "Commuted value of pension|Commuted pension|10\\(10A\\)"],
  ["10(10AA)", "Cash equivalent of leave salary|Leave (?:salary )?encashment|10\\(10AA\\)"],
];

/** Chapter VI-A rows as the employer reports them; the section spellings are the engine's. */
const EMPLOYER_CLAIMS: [string, string][] = [
  ["80CCD_2", "80CCD\\s*\\(2\\)"],
  ["80CCD_1B", "80CCD\\s*\\(1B\\)"],
  ["80CCD_1", "80CCD\\s*\\(1\\)"],
  ["80CCC", "80CCC(?![A-Z(])"],
  ["80C", "80C(?![A-Z(])"],
  ["80D_SELF", "80D(?![A-Z(])"],
  ["80E", "80E(?![A-Z(])"],
  ["80G", "80G(?![A-Z(])"],
  ["80TTA", "80TTA"],
];

/** AIS Part B line codes → what the row is. Real AIS uses SFT-016/015/017; the 2026-09-07 mock PDFs used SFT-005 and DIV-001. */
const AIS_LINE = /^(TDS-192|TDS-194A|TDS-194|SFT-0\d\d|DIV-\d{3})\s+(.+?)\s+((?:TAN|SB|FD|DP|UCC|ACC|CL)[-:]\s*\S+)\s+([0-9,]+)(?:\s+([0-9,]+))?\s*$/gim;

/**
 * The rows a Form 16 Part B and an AIS carry beyond salary and TDS (Phase B, 2026-09-07). Every field is
 * optional: a row the parser cannot see is simply not read, and the yearly intake asks for it instead.
 * Exported so the same parser runs on the raw byte scan and on the decompressed text layer.
 */
export function extractRichFieldsFromText(text: string): Partial<ExtractedFields> {
  const out: Partial<ExtractedFields> = {};
  const read: string[] = [];

  const tan = /TAN(?:\s+of\s+(?:the\s+)?Deductor)?[^A-Z0-9\n]{0,30}([A-Z]{4}[0-9]{5}[A-Z])/i.exec(text);
  if (tan) {
    out.tan = tan[1].toUpperCase();
    read.push("tan");
  }

  const s17_1 = grabAmount(text, "Salary as per (?:provisions contained in )?section 17\\(1\\)|Gross Salary u\\/s 17\\(1\\)");
  const s17_2 = grabAmount(text, "Value of perquisites u\\/s 17\\(2\\)|perquisites under section 17\\(2\\)");
  const s17_3 = grabAmount(text, "Profits in lieu of salary u\\/s 17\\(3\\)|profits in lieu of salary under section 17\\(3\\)");
  if (s17_1 !== undefined || s17_2 !== undefined || s17_3 !== undefined) {
    out.salaryParts = { s17_1, s17_2, s17_3 };
    read.push("salaryParts");
  }

  const exempt: NonNullable<ExtractedFields["exemptAllowances"]> = [];
  for (const [section, label] of EXEMPTIONS) {
    const amount = grabAmount(text, label);
    if (amount !== undefined && amount > 0 && !exempt.some((e) => e.section === section)) exempt.push({ section, amount });
  }
  if (exempt.length) {
    out.exemptAllowances = exempt;
    read.push("exemptAllowances");
  }

  const professionalTax = grabAmount(text, "Tax on employment|Professional Tax");
  if (professionalTax !== undefined) {
    out.professionalTax = professionalTax;
    read.push("professionalTax");
  }

  const claims: NonNullable<ExtractedFields["employerClaims"]> = [];
  for (const [section, label] of EMPLOYER_CLAIMS) {
    const amount = grabAmount(text, `(?:section\\s+|u\\/s\\s+|Sec\\.?\\s+)?${label}`);
    if (amount !== undefined && amount > 0) claims.push({ section, amount });
  }
  if (claims.length) {
    out.employerClaims = claims;
    read.push("employerClaims");
  }

  const regime = /opting out of (?:taxation\s+)?(?:u\/s|under section)?\s*115BAC(?:\(1A\))?[^A-Za-z\n]{0,40}(Yes|No)/i.exec(text);
  if (regime) {
    out.regimeOptOut = regime[1].toLowerCase() === "yes";
    read.push("regimeOptOut");
  }

  // AIS Part B lines with a reporter; the TIS summary rows are the fallback when the lines are missing.
  const otherIncome: NonNullable<ExtractedFields["otherIncome"]> = [];
  const tdsOther: NonNullable<ExtractedFields["tdsOther"]> = [];
  let ltcgGain: number | undefined;
  let ltcgReporter = "AIS";
  let m: RegExpExecArray | null;
  AIS_LINE.lastIndex = 0;
  while ((m = AIS_LINE.exec(text)) !== null) {
    const [, code, reporter, ref, amountRaw, tdsRaw] = m;
    const amount = parseIndianNumber(amountRaw);
    const tds = tdsRaw ? parseIndianNumber(tdsRaw) ?? 0 : 0;
    if (amount === undefined) continue;
    const c = code.toUpperCase();
    const deposit = /^FD/i.test(ref) || c === "TDS-194A";
    if (c === "TDS-194A" || c === "SFT-016" || c === "SFT-005") {
      otherIncome.push({ kind: "interest", label: `${deposit ? "Deposit" : "Savings account"} interest (${reporter})`, amount, reporter, identifier: ref, section: "SFT-016" });
      if (tds > 0) tdsOther.push({ section: "194A", reporter, amount: tds });
    } else if (c === "SFT-015" || c.startsWith("DIV-") || c === "TDS-194") {
      otherIncome.push({ kind: "dividend", label: `Dividend (${reporter})`, amount, reporter, identifier: ref, section: "SFT-015" });
      if (tds > 0) tdsOther.push({ section: "194", reporter, amount: tds });
    } else if (c === "SFT-017") {
      ltcgReporter = reporter;
      ltcgGain = ltcgGain ?? amount;
    }
  }
  if (otherIncome.length === 0) {
    const savings = grabAmount(text, "Savings Bank Interest|Interest from savings");
    if (savings !== undefined) otherIncome.push({ kind: "interest", label: "Savings account interest (AIS)", amount: savings, reporter: "AIS", section: "SFT-016" });
    const deposit = grabAmount(text, "Time Deposit Interest|Interest from deposit");
    if (deposit !== undefined) otherIncome.push({ kind: "interest", label: "Deposit interest (AIS)", amount: deposit, reporter: "AIS", section: "SFT-016" });
    const dividend = grabAmount(text, "Dividend Income|Dividend");
    if (dividend !== undefined) otherIncome.push({ kind: "dividend", label: "Dividend (AIS)", amount: dividend, reporter: "AIS", section: "SFT-015" });
  }
  const ltcgRow = grabAmount(text, "Sec(?:tion)?\\s*112A LTCG|Long[- ]term capital gains? u\\/s 112A");
  if (ltcgRow !== undefined) ltcgGain = ltcgRow;
  if (otherIncome.length) {
    out.otherIncome = otherIncome;
    read.push("otherIncome");
  }
  if (tdsOther.length) {
    out.tdsOther = tdsOther;
    read.push("tdsOther");
  }
  if (ltcgGain !== undefined && ltcgGain > 0) {
    // AIS states the gain in the summary; sale and cost come from the broker statement when it is uploaded.
    out.ltcg112A = { gain: ltcgGain, sale: ltcgGain, cost: 0, reporter: ltcgReporter };
    read.push("ltcg112A");
  }

  if (read.length) out.readFields = read;
  return out;
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

  const nameMatch =
    text.match(
      /(?:Name of (?:the )?(?:Employee|Deductee|Assessee|Taxpayer)|Taxpayer Name|Assessee Name)[\s:]+([A-Za-z'’.\s]{2,40})/i,
    ) ||
    text.match(/Name:\s*([A-Za-z'’.][A-Za-z'’. ]{2,34}?)(?:\s+(?:PAN|DOB|P AN)\b|\n|$)/i) ||
    text.match(/\/Title\s*\((?:AIS\s*\/?\s*TIS\s*Statement\s*-\s*|Form\s*16\s*-\s*)([A-Za-z'’.\s]{2,40})\)/i);
  const employerMatch =
    text.match(
      /(?:Name of (?:the )?Employer|Name of (?:the )?Deductor)[\s:]+([A-Za-z\s.,&-]{3,50})/i,
    ) ||
    text.match(/TDS-192\s*\n\s*([A-Za-z\s.,&-]{3,50}?)\s*\n\s*(?:TAN|T AN)/i) ||
    text.match(/Name:\s*([A-Za-z&.,'][A-Za-z&.,' -]{2,49}?)\s+TAN\b/);

  return {
    pan,
    name: nameMatch ? nameMatch[1].replace(/\s+/g, " ").trim() : undefined,
    employerName: employerMatch ? employerMatch[1].replace(/\s+/g, " ").trim() : undefined,
    grossSalary: grossSalaryRaw ? parseIndianNumber(grossSalaryRaw) : undefined,
    tds: tdsRaw ? parseIndianNumber(tdsRaw) : undefined,
    ...extractRichFieldsFromText(text),
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
      const reader = ds.readable.getReader();

      const writePromise = writer.write(rawBytes as unknown as BufferSource).catch(() => {});
      const closePromise = writer.close().catch(() => {});

      const chunks: Uint8Array[] = [];
      let total = 0;
      let readOk = true;

      while (true) {
        let readResult;
        try {
          readResult = await reader.read();
        } catch {
          readOk = false;
          break;
        }
        const { done, value } = readResult;
        if (done) break;
        if (value) {
          total += value.length;
          if (total > MAX_DECOMPRESSED_BYTES) {
            try { await reader.cancel(); } catch {}
            readOk = false;
            break;
          }
          chunks.push(value);
        }
      }

      await writePromise;
      await closePromise;

      if (!readOk) continue;

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

  // 1. Employee / Taxpayer Name
  let name = syncFields.name;
  if (!name) {
    const empNameMatch =
      fullText.match(
        /(?:Name of (?:the )?(?:Employee|Deductee|Assessee|Taxpayer)|Taxpayer Name|Assessee Name)[\s:]+([A-Za-z'’.\s]{2,40})/i,
      ) ||
      // Multi-line layout where "Name:" is followed by newline and then name, followed by DOB / Aadhaar / PAN / etc.
      fullText.match(
        /Name\s*:\s*\n\s*([A-Za-z'’.\s]{2,40}?)\s*\n\s*(?:DOB|Date of Birth|P\s*AN|PAN|Aadhaar|Father|Address|Mobile|Financial|Assessment)/i,
      ) ||
      fullText.match(/Name\s*:\s*\n\s*([A-Za-z'’.\s]{2,40})/i) ||
      fullText.match(/Name\s*:\s*([A-Za-z'’.\s]{2,40})/i) ||
      fullText.match(
        /Name[^\w\n]*\n\s*([A-Za-z\s]{3,35})\s*\n\s*(?:PAN|P AN)/i,
      );
    if (empNameMatch) {
      const cand = empNameMatch[1].replace(/\s+/g, " ").trim();
      if (!/^(of the|the employee|the employer|taxpayer|assessee|pan|tan|na|null|undefined)$/i.test(cand)) {
        name = cand;
      }
    }
  }

  // Title / Metadata fallback if still not found
  if (!name) {
    const titleMatch = latin.match(/\/Title\s*\((?:AIS\s*\/?\s*TIS\s*Statement\s*-\s*|Form\s*16\s*-\s*)([A-Za-z'’.\s]{2,40})\)/i);
    if (titleMatch) {
      name = titleMatch[1].replace(/\s+/g, " ").trim();
    }
  }

  // 2. Employer Name
  let employerName = syncFields.employerName;
  if (!employerName) {
    const emplyrMatch =
      fullText.match(
        /(?:Name of (?:the )?Employer|Name of (?:the )?Deductor)[\s:]+([A-Za-z\s.,&-]{3,50})/i,
      ) ||
      fullText.match(/TDS-192\s*\n\s*([A-Za-z\s.,&-]{3,50}?)\s*\n\s*(?:TAN|T AN)/i) ||
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
      /(?:Employee Details|Deductee|Taxpayer|Assessee)[\s\S]{0,250}?(?:PAN|P AN)[^\w]*([A-Z]{5}[0-9]{4}[A-Z])/i,
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
    const salMatch =
      fullText.match(
        /(?:Salary\s*u\/s\s*17\(1\)|Total\s*Gross\s*Salary|Gross\s*Salary|Salary\s*\(TDS-192\))[\s\S]{0,60}?([0-9]{1,3}(?:,[0-9]{2,3})+)/i,
      ) ||
      fullText.match(/TDS-192[\s\S]{0,80}?TAN:[^\n]+\n\s*([0-9]{1,3}(?:,[0-9]{2,3})+)/i);
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

  // The rows (Phase B): whatever the raw scan already read stands; the text layer fills the rest.
  const rich = { ...extractRichFieldsFromText(fullText), ...stripUndefined(syncFields) };
  return {
    ...rich,
    pan,
    name,
    employerName,
    grossSalary: grossSalary ?? rich.salaryParts?.s17_1,
    tds,
  };
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
