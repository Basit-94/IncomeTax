/**
 * Dictation for the composer: record a phrase with the browser's MediaRecorder, then transcribe it
 * with faster-whisper through /api/transcribe (scripts/transcribe_worker.py on this machine).
 *
 * Why not the browser's SpeechRecognition any more (2026-09-07, user: "the transcribe feature is not
 * working, use fastwhisper"): Chrome's recognizer is server-based and needs Google's service behind it,
 * so it failed here without a word of explanation, and it never covered most of the 23 languages. Whisper
 * runs locally, covers fifteen of them by name and detects the rest, and the audio never leaves the
 * machine.
 *
 * Shape kept from the old wrapper: `isSpeechSupported()` gates the mic button, `startDictation()`
 * returns a handle whose `stop()` ends the recording (tap the mic again) and sends it off. Recording also
 * ends by itself after 1.6 s of silence once something was heard, or at 45 s.
 */

import type { Lang } from "./types";

/**
 * Whisper's language codes for the 23 languages. `null` = let the model detect: Whisper was not trained on
 * Odia, Maithili, Santali, Kashmiri, Konkani, Dogri, Manipuri or Bodo, and a wrong forced language is worse
 * than detection.
 */
export const WHISPER_LANGUAGE: Record<Lang, string | null> = {
  en: "en",
  hi: "hi",
  ta: "ta",
  as: "as",
  bn: "bn",
  brx: null,
  doi: null,
  gu: "gu",
  kn: "kn",
  ks: null,
  kok: null,
  mai: null,
  ml: "ml",
  mni: null,
  mr: "mr",
  ne: "ne",
  or: null,
  pa: "pa",
  sa: "sa",
  sat: null,
  sd: "sd",
  te: "te",
  ur: "ur",
};

export function whisperLanguageFor(lang: Lang): string | null {
  return WHISPER_LANGUAGE[lang] ?? null;
}

/** Stop after this much silence once speech was heard; never record longer than MAX_MS. */
const SILENCE_MS = 3500;
const MAX_MS = 60_000;
/** Below this RMS (0–1) a frame counts as silence. Room noise on a laptop mic sits around 0.005–0.01. */
const SPEECH_RMS = 0.015;

/**
 * Must only be called from an effect or an event handler. Calling it during render would disagree with the
 * server-rendered HTML and produce a hydration mismatch.
 */
export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof MediaRecorder !== "undefined" && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

/* ------------------------------------------------------------------------- */

export type Dictation = {
  /** Ends the recording and sends it for transcription. Idempotent. */
  stop(): void;
};

type DictationOptions = {
  lang: Lang;
  /** Kept for callers; the recorder has no interim words to offer, so this never fires. */
  onPartial(text: string): void;
  /** Fires once with the transcribed phrase. */
  onFinal(text: string): void;
  /** `not-allowed`, `no-speech`, `network`, `transcriber_unavailable`, `timeout`, `transcribe_failed`. */
  onError(reason: string): void;
  /** Always fires last, whether the run succeeded or not. */
  onEnd(): void;
  /** Real-time microphone audio volume level (0 to 1) for the speaking waveform. */
  onAudioLevel?(level: number): void;
  /** Fires when user stops speaking and the recorded clip is handed to the transcriber. */
  onTranscribing?(): void;
};

function pickMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

function extensionFor(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  return "webm";
}

let prewarmedStream: MediaStream | null = null;
let prewarmingPromise: Promise<MediaStream | null> | null = null;

/** Pre-warm the audio input device so clicking the mic starts recording in 0ms without hardware startup latency. */
export function warmUpAudioStream(): void {
  if (typeof window === "undefined" || !isSpeechSupported()) return;
  if (prewarmedStream && prewarmedStream.active && prewarmedStream.getAudioTracks().some((t) => t.readyState === "live")) {
    return;
  }
  if (prewarmingPromise) return;
  prewarmingPromise = navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((s) => {
      prewarmedStream = s;
      prewarmingPromise = null;
      return s;
    })
    .catch(() => {
      prewarmingPromise = null;
      return null;
    });
}

/**
 * Starts one recording and returns a handle to stop it. Returns `null` when the browser cannot record —
 * the caller is expected to check `isSpeechSupported()` first and say so in the interface.
 */
export function startDictation(opts: DictationOptions): Dictation | null {
  if (!isSpeechSupported()) return null;

  let stopped = false;
  let heardSpeech = false;
  let meterAvailable = false;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;
  let frame = 0;
  let capTimer: ReturnType<typeof setTimeout> | null = null;
  const chunks: Blob[] = [];

  const cleanup = () => {
    if (frame) cancelAnimationFrame(frame);
    if (capTimer) clearTimeout(capTimer);
    stream?.getTracks().forEach((t) => t.stop());
    void audioCtx?.close().catch(() => {});
    // Pre-warm the next stream in background
    setTimeout(warmUpAudioStream, 500);
  };

  const send = async () => {
    cleanup();
    const mime = recorder?.mimeType || "audio/webm";
    const blob = new Blob(chunks, { type: mime });
    // A meter that never saw speech, or a clip too short to hold a word: say so instead of transcribing air.
    if (blob.size < 1_000 || (meterAvailable && !heardSpeech)) {
      opts.onError("no-speech");
      opts.onEnd();
      return;
    }
    try {
      opts.onTranscribing?.();
      const form = new FormData();
      form.append("audio", blob, `clip.${extensionFor(mime)}`);
      const language = whisperLanguageFor(opts.lang);
      if (language) form.append("language", language);
      let res = await fetch("/api/transcribe", { method: "POST", credentials: "same-origin", body: form }).catch(() => null);
      if (!res || !res.ok) {
        // Dual fallback: try /api/speech if /api/transcribe errored or is unreachable
        res = await fetch("/api/speech", { method: "POST", credentials: "same-origin", body: form }).catch(() => null);
      }
      if (!res) {
        opts.onError("network");
        opts.onEnd();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; text?: string; error?: string };
      if (!res.ok || body.ok === false) opts.onError(body.error ?? "transcribe_failed");
      else if (!String(body.text ?? "").trim()) opts.onError("no-speech");
      else opts.onFinal(String(body.text).trim());
    } catch {
      opts.onError("network");
    }
    opts.onEnd();
  };

  const stopRecording = () => {
    if (stopped) return;
    stopped = true;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // onstop → send()
    } else {
      cleanup();
      opts.onEnd();
    }
  };

  const setupRecorder = (s: MediaStream) => {
    if (stopped) {
      s.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = s;
    const mimeType = pickMimeType();
    recorder = new MediaRecorder(s, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => void send();
    recorder.start(100);
    capTimer = setTimeout(stopRecording, MAX_MS);

    // Silence detection: end the phrase on its own, the way the old recognizer did.
    try {
      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(s);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      meterAvailable = true;
      let lastLoud = performance.now();
      const tick = () => {
        if (stopped) return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) {
          const d = (buf[i] - 128) / 128;
          sum += d * d;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();
        const normalized = Math.min(1, Math.max(0, (rms - 0.005) * 14));
        opts.onAudioLevel?.(normalized);
        if (rms > SPEECH_RMS) {
          lastLoud = now;
          heardSpeech = true;
        }
        if (heardSpeech && now - lastLoud > SILENCE_MS) {
          stopRecording();
          return;
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    } catch {
      // No Web Audio: the cap timer and the user's tap end the recording.
    }
  };

  // If we already have a live prewarmed stream ready, use it immediately (0ms start delay)!
  if (prewarmedStream && prewarmedStream.active && prewarmedStream.getAudioTracks().some((t) => t.readyState === "live")) {
    const s = prewarmedStream;
    prewarmedStream = null;
    setupRecorder(s);
  } else if (prewarmingPromise) {
    prewarmingPromise
      .then((s) => {
        if (s && s.active && s.getAudioTracks().some((t) => t.readyState === "live")) {
          prewarmedStream = null;
          setupRecorder(s);
        } else {
          navigator.mediaDevices.getUserMedia({ audio: true }).then(setupRecorder).catch(() => {
            stopped = true;
            opts.onError("not-allowed");
            opts.onEnd();
          });
        }
      })
      .catch(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(setupRecorder).catch(() => {
          stopped = true;
          opts.onError("not-allowed");
          opts.onEnd();
        });
      });
  } else {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(setupRecorder).catch(() => {
      stopped = true;
      opts.onError("not-allowed");
      opts.onEnd();
    });
  }

  return {
    stop() {
      stopRecording();
    },
  };
}
