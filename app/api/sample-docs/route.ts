import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SAMPLE_DOCS = [
  {
    id: "anthony_form16",
    fileName: "Form 16 - Anthony D'Souza.pdf",
    kind: "FORM_16",
    title: "Form 16 · Anthony D'Souza",
    pan: "ABCPD1982K",
    personKey: "anthony",
    description: "Salary ₹16,20,000, Section 192 TDS ₹1,24,000",
  },
  {
    id: "anthony_ais",
    fileName: "AIS _ TIS Statement - Anthony D'Souza.pdf",
    kind: "AIS",
    title: "AIS / TIS · Anthony D'Souza",
    pan: "ABCPD1982K",
    personKey: "anthony",
    description: "Savings Interest ₹42,500, Dividend ₹15,000, 194A TDS ₹4,150",
  },
  {
    id: "faheem_form16",
    fileName: "Form 16 - Faheem Ahmed.pdf",
    kind: "FORM_16",
    title: "Form 16 · Faheem Ahmed",
    pan: "BZSPA7412M",
    personKey: "faheem",
    description: "Salary ₹13,80,000, Section 192 TDS ₹76,000",
  },
  {
    id: "faheem_ais",
    fileName: "AIS _ TIS Statement - Faheem Ahmed.pdf",
    kind: "AIS",
    title: "AIS / TIS · Faheem Ahmed",
    pan: "BZSPA7412M",
    personKey: "faheem",
    description: "Bank Interest ₹18,200, SFT Mutual Funds, 194A TDS ₹5,770",
  },
  {
    id: "arjun_form16",
    fileName: "Form 16 - Arjun Mehta.pdf",
    kind: "FORM_16",
    title: "Form 16 · Arjun Mehta",
    pan: "BMZPM4821K",
    personKey: "arjun",
    description: "Salary ₹18,50,000, TDS ₹1,65,000",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("file");

  if (!fileName) {
    return NextResponse.json({ ok: true, samples: SAMPLE_DOCS });
  }

  // Security: only allow files from the whitelisted list to prevent path traversal
  const matched = SAMPLE_DOCS.find((s) => s.fileName.toLowerCase() === fileName.toLowerCase() || s.id === fileName);
  if (!matched) {
    return NextResponse.json({ ok: false, error: "sample_not_found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), matched.fileName);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ ok: false, error: "file_missing_on_server" }, { status: 404 });
  }

  const buffer = await fs.promises.readFile(filePath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(matched.fileName)}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
