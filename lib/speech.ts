/**
 * A thin wrapper over the browser's own speech recognition.
 *
 * Why the platform API rather than a hosted model: no key, no billing, no
 * server of ours in the path, and it works on Chrome for Android, which is the
 * device this product is designed for.
 *
 * What it is honestly not: an offline feature. Chrome's implementation is
 * server-based — audio is sent away for recognition — so this is a
 * zero-dependency choice, not a low-bandwidth one. Global support is roughly
 * 88% partial and 0% full, so `isSupported()` is not a formality: Firefox for
 * Android and Opera Mini have nothing here, and the caller must degrade
 * visibly rather than present a dead button.
 *
 * Types are declared locally and reached through a cast rather than relying on
 * `lib.dom`, because `webkitSpeechRecognition` is unprefixed nowhere and typed
 * inconsistently across TypeScript versions.
 */

import type { Lang } from "./types";

/** BCP-47 tags. Indian English rather than en-US — the vocabulary differs. */
const RECOGNITION_LOCALE: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
};

/* -- minimal structural types for the bit of the API we touch -------------- */

type ResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type ErrorEvent = { error: string };

type Recognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: ResultEvent) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type RecognizerConstructor = new () => Recognizer;

function getConstructor(): RecognizerConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognizerConstructor;
    webkitSpeechRecognition?: RecognizerConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Must only be called from an effect or an event handler. Calling it during
 * render would disagree with the server-rendered HTML and produce a hydration
 * mismatch.
 */
export function isSpeechSupported(): boolean {
  return getConstructor() !== null;
}

/* ------------------------------------------------------------------------- */

export type Dictation = {
  /** Idempotent. Safe to call after the engine has already stopped. */
  stop(): void;
};

type DictationOptions = {
  lang: Lang;
  /** Fires repeatedly as the phrase forms, so the user can see it working. */
  onPartial(text: string): void;
  /** Fires once with the settled phrase. */
  onFinal(text: string): void;
  /** Permission refused, no network, nothing audible. */
  onError(reason: string): void;
  /** Always fires last, whether the run succeeded or not. */
  onEnd(): void;
};

/**
 * Starts one utterance and returns a handle to cancel it. Returns `null` if the
 * browser has no recognition at all — the caller is expected to check
 * `isSpeechSupported()` first and say so in the interface, but returning `null`
 * means a missed check degrades to nothing happening rather than to a throw.
 */
export function startDictation(opts: DictationOptions): Dictation | null {
  const Ctor = getConstructor();
  if (!Ctor) return null;

  let settled = false;
  let recognizer: Recognizer;

  try {
    recognizer = new Ctor();
  } catch {
    return null;
  }

  recognizer.lang = RECOGNITION_LOCALE[opts.lang];
  // One phrase, not an open microphone. A dispute reason is a sentence or two,
  // and an indefinitely open mic on a metered connection is a poor trade.
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;

  recognizer.onresult = (event) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? "";
      if (result.isFinal) final += text;
      else interim += text;
    }
    if (final.trim()) {
      settled = true;
      opts.onFinal(final.trim());
    } else if (interim.trim()) {
      opts.onPartial(interim.trim());
    }
  };

  recognizer.onerror = (event) => {
    settled = true;
    opts.onError(event.error || "unknown");
  };

  recognizer.onend = () => {
    // Chrome ends the session on silence without ever producing a result. That
    // is a failed attempt from the user's point of view, so report it as one.
    if (!settled) opts.onError("no-speech");
    opts.onEnd();
  };

  try {
    recognizer.start();
  } catch {
    opts.onError("start-failed");
    opts.onEnd();
    return null;
  }

  return {
    stop() {
      try {
        recognizer.abort();
      } catch {
        /* already finished; nothing to abort */
      }
    },
  };
}
