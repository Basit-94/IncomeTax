import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/context";
import { transcribeAudio } from "@/lib/server/transcriber";

export const runtime = "nodejs";

/** 8 MB is ~45 s of Opus at the recorder's default bitrate, with room to spare. */
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

function extensionFor(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "m4a";
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  return "webm";
}

/**
 * Speech to text for the composer (multipart: `audio` blob, optional `language` = a Whisper code).
 * Runs faster-whisper on this machine through scripts/transcribe_worker.py; the audio is written to a
 * temp file for the worker and deleted as soon as the reply arrives. Owner-scoped like every other
 * route: a signed-in session is required.
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
    return NextResponse.json({ ok: false, error: "bad_request", message: "Attach the recording as `audio`." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large", message: "Keep a dictation under 45 seconds." }, { status: 413 });
  }
  const rawLang = form.get("language");
  const language = typeof rawLang === "string" && /^[a-z]{2,3}$/.test(rawLang) ? rawLang : null;

  try {
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const result = await transcribeAudio(bytes, extensionFor(audio.type), language);
    return NextResponse.json({ ok: true, text: result.text, language: result.language });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "transcriber_unavailable") {
      return NextResponse.json(
        { ok: false, error: "transcriber_unavailable", message: "Speech to text needs Python with faster-whisper on this machine (see .env.example)." },
        { status: 503 },
      );
    }
    if (message === "timeout") {
      return NextResponse.json({ ok: false, error: "timeout", message: "The transcriber did not answer in time." }, { status: 504 });
    }
    return NextResponse.json({ ok: false, error: "transcribe_failed", message }, { status: 500 });
  }
}
