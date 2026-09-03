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

/**
 * BCP-47 tags. Indian English rather than en-US — the vocabulary differs.
 * Chrome's recognizer covers the bigger languages here (bn, te, mr, gu, kn,
 * ml, pa, ur, …); for the ones it doesn't, the tag is still the correct
 * request and the engine degrades to an error the caller already shows.
 */
const RECOGNITION_LOCALE: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  as: "as-IN",
  bn: "bn-IN",
  brx: "brx-IN",
  doi: "doi-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ks: "ks-IN",
  kok: "kok-IN",
  mai: "mai-IN",
  ml: "ml-IN",
  mni: "mni-IN",
  mr: "mr-IN",
  ne: "ne-NP",
  or: "or-IN",
  pa: "pa-IN",
  sa: "sa-IN",
  sat: "sat-IN",
  sd: "sd-IN",
  te: "te-IN",
  ur: "ur-IN",
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
  /** Fires as speech is recognised: everything settled so far plus the phrase forming now. */
  onPartial(text: string): void;
  /** Fires once, with everything recognised, when the person has been silent for `silenceMs`. */
  onFinal(text: string): void;
  /** Permission refused, no network, nothing audible. */
  onError(reason: string): void;
  /** Always fires last, whether the run succeeded or not. */
  onEnd(): void;
  /** Stop after this much silence once speech has been heard (default 3 s). */
  silenceMs?: number;
  /** How long to wait for the first words before giving up (default 8 s). */
  initialMs?: number;
};

const DEFAULT_SILENCE_MS = 3_000;
const DEFAULT_INITIAL_MS = 8_000;

/**
 * Listens continuously: keeps the microphone open while the person speaks, accumulates
 * every settled phrase, and stops on its own after `silenceMs` without a new word. Chrome
 * closes a continuous session on its own every so often; while the person is still within
 * the silence window the session is reopened transparently, so a pause for breath does not
 * end the dictation. Returns `null` if the browser has no recognition at all.
 */
export function startDictation(opts: DictationOptions): Dictation | null {
  const Ctor = getConstructor();
  if (!Ctor) return null;

  const silenceMs = opts.silenceMs ?? DEFAULT_SILENCE_MS;
  const initialMs = opts.initialMs ?? DEFAULT_INITIAL_MS;
  let finalText = "";
  let interimText = "";
  let heardAnything = false;
  let stopping = false;
  let failed: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let restarts = 0;
  let recognizer: Recognizer | null = null;

  const combined = () => `${finalText} ${interimText}`.replace(/\s+/g, " ").trim();

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const finish = () => {
    if (stopping) return;
    stopping = true;
    clearTimer();
    try {
      recognizer?.stop();
    } catch {
      /* already stopped */
    }
  };

  const armTimer = () => {
    clearTimer();
    timer = setTimeout(finish, heardAnything ? silenceMs : initialMs);
  };

  const settle = () => {
    const text = combined();
    if (failed && !text) opts.onError(failed);
    else if (text) opts.onFinal(text);
    else opts.onError("no-speech");
    opts.onEnd();
  };

  const open = (): boolean => {
    try {
      recognizer = new Ctor();
    } catch {
      return false;
    }
    recognizer.lang = RECOGNITION_LOCALE[opts.lang];
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.maxAlternatives = 1;

    recognizer.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalText = `${finalText} ${text}`.trim();
        else interim += text;
      }
      interimText = interim.trim();
      if (combined()) {
        heardAnything = true;
        opts.onPartial(combined());
      }
      armTimer();
    };

    recognizer.onerror = (event) => {
      const reason = event.error || "unknown";
      // Chrome raises no-speech on its own idle timeout; that is not a failure while the
      // person may still be about to speak, so the session is simply reopened.
      if (reason === "no-speech" || reason === "aborted") return;
      failed = reason;
      finish();
    };

    recognizer.onend = () => {
      if (stopping || failed) {
        clearTimer();
        settle();
        return;
      }
      // Chrome closed the session by itself; keep listening while the silence window is open.
      if (restarts < 20 && open()) {
        restarts += 1;
        return;
      }
      clearTimer();
      settle();
    };

    try {
      recognizer.start();
      return true;
    } catch {
      return false;
    }
  };

  if (!open()) {
    opts.onError("start-failed");
    opts.onEnd();
    return null;
  }
  armTimer();

  return {
    stop() {
      // The person tapped the mic again: deliver what was heard so far, now.
      finish();
    },
  };
}
