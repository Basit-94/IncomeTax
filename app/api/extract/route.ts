import { NextRequest, NextResponse } from "next/server";
import { extractFieldsFromPdf, detectDocumentKind } from "@/lib/compliance/pdfExtract";
import { getGeminiKeys } from "@/lib/server/geminiKeys";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export async function POST(req: NextRequest) {
  try {
    let textContent = "";
    let fileName = "";
    let extractedDeterministic: Awaited<ReturnType<typeof extractFieldsFromPdf>> | null = null;
    let detectedKind: "FORM_16" | "AIS" = "FORM_16";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
      }
      fileName = file.name || "";
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      detectedKind = detectDocumentKind(bytes, fileName);
      extractedDeterministic = await extractFieldsFromPdf(bytes);
    } else {
      const body = await req.json().catch(() => ({}));
      textContent = typeof body.text === "string" ? body.text : "";
      fileName = typeof body.fileName === "string" ? body.fileName : "";
      if (body.extracted) {
        extractedDeterministic = body.extracted;
      }
      if (body.kind === "AIS" || body.kind === "FORM_16") {
        detectedKind = body.kind;
      } else if (fileName) {
        detectedKind = /ais|tis|annual\s*info/i.test(fileName) ? "AIS" : "FORM_16";
      }
    }

    // Heuristic extraction from fileName if name is not yet determined
    let candidateName = extractedDeterministic?.name;
    if (!candidateName && fileName) {
      const cleanBase = fileName.replace(/\.[^/.]+$/, "");
      const m = cleanBase.match(/(?:AIS\s*(?:_\s*|\/\s*)TIS\s*(?:Statement)?\s*-\s*|Form\s*16\s*-\s*)([A-Za-z'’.\s]{2,40})/i);
      if (m) candidateName = m[1].trim();
    }

    let resultPan = extractedDeterministic?.pan;
    let resultName = candidateName;
    let resultEmployer = extractedDeterministic?.employerName;
    let resultGross = extractedDeterministic?.grossSalary;
    let resultTds = extractedDeterministic?.tds;
    let source: "gemini" | "deterministic" = "deterministic";

    // Call Gemini AI for smart reasoning & ambiguous/scanned/altered text interpretation
    const keys = getGeminiKeys();
    const model = process.env.AGENT_MODEL?.trim() || process.env.AGENT_FALLBACK_MODEL?.trim() || "gemini-2.5-flash";

    if (keys.length > 0 && (textContent || extractedDeterministic)) {
      const sampleText = (textContent || JSON.stringify(extractedDeterministic)).slice(0, 6000);
      const prompt = `You are an expert Indian Income Tax document parser for Form 16, AIS (Annual Information Statement), TIS, and 26AS.
Extract the taxpayer and financial entities from this document content.

File Name: "${fileName}"
Document Content:
${sampleText}

Output Instructions:
1. "pan": 10-character Indian Permanent Account Number (format: 5 uppercase letters, 4 digits, 1 letter, e.g. BZSPA7412M).
2. "name": The taxpayer / citizen's legal human name (e.g. "FAHEEM AHMED", "Anthony D'Souza"). NOT an employer name, and NOT generic terms like "Taxpayer" or "Citizen".
3. "employerName": The employer or deductor company name if present (e.g. "Tech Mahindra Ltd", "Tata Consultancy Services").
4. "grossSalary": Gross salary in INR as a plain integer number, or null if absent.
5. "tds": Total tax deducted at source in INR as a plain integer number, or null if absent.
6. "kind": "FORM_16" or "AIS".

Return ONLY a JSON object with those keys:
{"pan": "...", "name": "...", "employerName": "...", "grossSalary": 12345, "tds": 1234, "kind": "..."}`;

      for (const key of keys) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
            }),
            signal: AbortSignal.timeout(5000),
          });

          if (!res.ok) continue;

          const data = await res.json();
          const raw = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
          const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          const parsed = JSON.parse(cleaned);

          if (parsed && typeof parsed === "object") {
            if (typeof parsed.pan === "string" && PAN_REGEX.test(parsed.pan.trim().toUpperCase())) {
              resultPan = parsed.pan.trim().toUpperCase();
            }
            if (typeof parsed.name === "string" && parsed.name.trim().length >= 2) {
              const cleanedName = parsed.name.trim();
              if (!/^(citizen|taxpayer|assessee|employee|deductee|pan|tan)$/i.test(cleanedName)) {
                resultName = cleanedName;
              }
            }
            if (typeof parsed.employerName === "string" && parsed.employerName.trim()) {
              resultEmployer = parsed.employerName.trim();
            }
            if (typeof parsed.grossSalary === "number" && parsed.grossSalary > 0) {
              resultGross = Math.round(parsed.grossSalary);
            }
            if (typeof parsed.tds === "number" && parsed.tds >= 0) {
              resultTds = Math.round(parsed.tds);
            }
            if (parsed.kind === "AIS" || parsed.kind === "FORM_16") {
              if (/ais|tis|annual\s*info/i.test(fileName)) {
                detectedKind = "AIS";
              } else {
                detectedKind = parsed.kind;
              }
            }
            source = "gemini";
            break;
          }
        } catch {
          // Fall through to next key or deterministic
        }
      }
    }

    return NextResponse.json({
      ok: true,
      source,
      data: {
        pan: resultPan,
        name: resultName,
        employerName: resultEmployer,
        grossSalary: resultGross,
        tds: resultTds,
        kind: detectedKind,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "extraction_failed" },
      { status: 500 }
    );
  }
}
