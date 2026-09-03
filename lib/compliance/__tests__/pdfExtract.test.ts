import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  PAN_RE,
  decodeLatin1,
  extractFieldsFromPdf,
  extractFieldsFromPdfBytes,
  isEmptyExtraction,
  parseIndianNumber,
} from "../pdfExtract";

/** Latin-1 encode: one character, one byte — how an uncompressed PDF stores it. */
function latin1(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

const FORM_16 = [
  "%PDF-1.4",
  "FORM NO. 16",
  "Certificate under section 203 of the Income-tax Act, 1961",
  "Name and address of the Employer: Wapsi Technologies Private Limited",
  "TAN of the Deductor: BLRW12345E",
  "PAN of the Deductee: ABCDE1234F",
  "Assessment Year: 2026-27",
  "Gross Salary: Rs. 12,50,000",
  "Total Tax Deducted: Rs. 92,500",
].join("\n");

describe("extractFieldsFromPdfBytes", () => {
  it("reads PAN, gross salary and TDS out of an uncompressed Form 16", () => {
    const fields = extractFieldsFromPdfBytes(latin1(FORM_16));

    expect(fields.pan).toBe("ABCDE1234F");
    expect(fields.grossSalary).toBe(1_250_000);
    expect(fields.tds).toBe(92_500);
    expect(isEmptyExtraction(fields)).toBe(false);
  });

  it("accepts the statutory wording as well as the plain label", () => {
    const fields = extractFieldsFromPdfBytes(
      latin1("Salary u/s 17(1)  9,40,000\nTDS 61,000"),
    );

    expect(fields.grossSalary).toBe(940_000);
    expect(fields.tds).toBe(61_000);
  });

  it("reads a rupee sign that arrived as UTF-8 bytes", () => {
    // The byte-level decode turns E2 82 B9 into three Latin-1 characters, so a
    // pattern matching only the literal ₹ would miss every document that uses it.
    const utf8 = new TextEncoder().encode("Gross Salary: ₹12,50,000\nTDS: ₹92,500");
    const fields = extractFieldsFromPdfBytes(utf8);

    expect(fields.grossSalary).toBe(1_250_000);
    expect(fields.tds).toBe(92_500);
  });

  it("finds nothing in a compressed stream rather than guessing", () => {
    // A FlateDecode payload — which is what most real Form 16s are. The correct
    // answer here is "I cannot read this", not a plausible-looking number.
    const deflate = new Uint8Array([
      0x78, 0x9c, 0xab, 0x2e, 0x1f, 0x8b, 0x08, 0x00, 0xd3, 0x4f, 0xc9, 0x01,
      0xff, 0xfe, 0x7f, 0x3d, 0x00, 0x11, 0x9a, 0xe0,
    ]);
    const fields = extractFieldsFromPdfBytes(deflate);

    expect(fields).toEqual({ pan: undefined, grossSalary: undefined, tds: undefined });
    expect(isEmptyExtraction(fields)).toBe(true);
  });

  it("does not accept a lowercase PAN — the format is structural", () => {
    expect(PAN_RE.test("abcde1234f")).toBe(false);
    expect(extractFieldsFromPdfBytes(latin1("pan: abcde1234f")).pan).toBeUndefined();
  });

  it("leaves the fields it cannot find undefined instead of zero", () => {
    // Zero is a figure. Absent is not, and the reducer treats them differently:
    // an ingested 0 would overwrite a reported salary with nothing.
    const fields = extractFieldsFromPdfBytes(latin1("PAN: ZZZZZ9999Z"));

    expect(fields.pan).toBe("ZZZZZ9999Z");
    expect(fields.grossSalary).toBeUndefined();
    expect(fields.tds).toBeUndefined();
    expect(isEmptyExtraction(fields)).toBe(false);
  });
});

describe("decodeLatin1", () => {
  it("keeps bytes above 0x7F as single characters", () => {
    // Decoding as UTF-8 would collapse these into replacement characters and
    // break any match that straddles one.
    expect(decodeLatin1(new Uint8Array([0xe9, 0x41, 0xff]))).toBe("éAÿ");
  });

  it("survives a file larger than one chunk", () => {
    const filler = "x".repeat(0x8000 * 2 + 7);
    const fields = extractFieldsFromPdfBytes(
      latin1(`${filler}\nGross Salary: 4,00,000\n`),
    );
    expect(fields.grossSalary).toBe(400_000);
  });
});

describe("parseIndianNumber", () => {
  it("strips lakh-crore grouping", () => {
    expect(parseIndianNumber("12,50,000")).toBe(1_250_000);
    expect(parseIndianNumber("92500")).toBe(92_500);
  });

  it("rejects anything that is not a positive figure", () => {
    expect(parseIndianNumber("0")).toBeUndefined();
    expect(parseIndianNumber(",,,")).toBeUndefined();
    expect(parseIndianNumber("")).toBeUndefined();
    expect(parseIndianNumber("twelve lakh")).toBeUndefined();
  });

  it("returns whole rupees", () => {
    expect(parseIndianNumber("1,00,000")).toBe(100_000);
    expect(Number.isInteger(parseIndianNumber("1,00,000"))).toBe(true);
  });
});

describe("extractFieldsFromPdf async", () => {
  it("extracts from uncompressed bytes identical to sync version", async () => {
    const fields = await extractFieldsFromPdf(latin1(FORM_16));
    expect(fields.pan).toBe("ABCDE1234F");
    expect(fields.grossSalary).toBe(1_250_000);
    expect(fields.tds).toBe(92_500);
  });

  it("extracts PAN, salary, and TDS from real Chrome/Skia Form 16 with FlateDecode and CMaps", async () => {
    const realPdfPath = path.resolve(
      __dirname,
      "../../../../Form 16 - Certificate under Section 203.pdf",
    );
    // Alternative path if running from repo root
    const altPath = path.resolve(process.cwd(), "Form 16 - Certificate under Section 203.pdf");
    const targetPath = fs.existsSync(realPdfPath) ? realPdfPath : altPath;

    if (fs.existsSync(targetPath)) {
      const bytes = new Uint8Array(fs.readFileSync(targetPath));
      const fields = await extractFieldsFromPdf(bytes);
      expect(fields.pan).toBe("ABCDE1234F");
      expect(fields.name).toBe("PRIYA PATEL");
      expect(fields.employerName).toBe("INFOSYS TECHNOLOGIES LTD");
      expect(fields.grossSalary).toBe(1_450_000);
      expect(fields.tds).toBe(85_000);
    }
  });
});

