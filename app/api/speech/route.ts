import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { transcribeAudio } from "@/lib/harness/model";
import { isLang } from "@/lib/i18n";

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Voice fallback: the browser recorded a WAV (lib/speech-recorder.ts); Gemini transcribes it.
 * Audio only, no identifiers are extracted here; the text goes back to the composer exactly
 * as any typed message would. Signed-in accounts only.
 */
export async function POST(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  const file = form.get("audio");
  const lang = String(form.get("lang") ?? "en");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "missing_audio" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large", message: "Recording too long." }, { status: 413 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await transcribeAudio({ bytes, mimeType: file.type || "audio/wav", lang: isLang(lang) ? lang : "en" });
  if (!result.ok) {
    const correlationId = crypto.randomUUID();
    console.error(`[speech:${correlationId}] Transcription error:`, result.error);
    return NextResponse.json(
      { error: "transcription_failed", message: "Audio transcription failed. Please try typing instead.", correlationId },
      { status: 502 },
    );
  }
  return NextResponse.json({ text: result.text });
}
