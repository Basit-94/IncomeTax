import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/context";
import { transcribeAudio, mimeFromExt } from "@/lib/server/transcriber";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Speech transcription route (POST /api/speech).
 * Supports multipart audio uploads using the Gemini transcription engine (with local worker fallback).
 */
export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request", message: "Expected multipart form data." }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ ok: false, error: "missing_audio", message: "Attach the recording as `audio`." }, { status: 400 });
  }

  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large", message: "Keep recording under 45 seconds." }, { status: 413 });
  }

  const rawLang = form.get("language") ?? form.get("lang");
  const language = typeof rawLang === "string" && /^[a-z]{2,3}$/.test(rawLang) ? rawLang : null;

  try {
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const ext = audio.type ? audio.type.split("/")[1]?.split(";")[0] ?? "webm" : "webm";
    const result = await transcribeAudio(bytes, ext, language);
    return NextResponse.json({ ok: true, text: result.text, language: result.language });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: "transcription_failed", message }, { status: 502 });
  }
}
