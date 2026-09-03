"use client";

/**
 * The one text box (plan §3.8). A pill with a microphone and an "Ask" button, used in the
 * hero and at the foot of the chat. Voice is the browser's own recognition
 * (lib/speech.ts); the mic carries the honesty note that Chrome sends audio to Google.
 */
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Mic, MicOff } from "lucide-react";
import { isSpeechSupported, startDictation, type Dictation } from "@/lib/speech";
import { isRecorderSupported, startRecording, type Recording } from "@/lib/speech-recorder";
import type { Lang } from "@/lib/types";

/** Chrome's SpeechRecognitionErrorEvent.error values, in plain words. */
const SPEECH_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone permission was refused. Allow the microphone for this site in the browser's address bar, then try again.",
  "service-not-allowed": "This browser does not allow speech recognition here (embedded browsers usually block it). Open the site in Chrome.",
  "audio-capture": "No microphone was found. Plug one in or check the system sound settings.",
  network: "Chrome's speech service could not be reached. Recognition needs an internet connection.",
  "no-speech": "Could not hear anything. Speak right after tapping the mic, or type instead.",
  aborted: "Listening stopped.",
  "start-failed": "The microphone could not start. Try again.",
};

/** Once Chrome's speech service has failed on this browser, record and transcribe instead. */
const VOICE_MODE_KEY = "wapsi_voice_mode";
const FALLBACK_TRIGGERS = new Set(["network", "service-not-allowed"]);

export default function Composer({
  lang,
  placeholder,
  buttonLabel = "Ask",
  disabled = false,
  autoFocus = false,
  onSubmit,
  size = "md",
}: {
  lang: Lang;
  placeholder: string;
  buttonLabel?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmit: (text: string) => void;
  size?: "md" | "lg";
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [speechOk, setSpeechOk] = useState(false);
  const [speechNote, setSpeechNote] = useState<string | null>(null);
  const dictation = useRef<Dictation | null>(null);
  const recording = useRef<Recording | null>(null);
  const baseText = useRef("");
  const [transcribing, setTranscribing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSpeechOk(isSpeechSupported() || isRecorderSupported());
    return () => {
      dictation.current?.stop();
      recording.current?.stop();
    };
  }, []);

  const recorderPreferred = () => {
    try {
      return localStorage.getItem(VOICE_MODE_KEY) === "recorder" || !isSpeechSupported();
    } catch {
      return !isSpeechSupported();
    }
  };

  /** The fallback: record locally, stop on 3 s of silence, transcribe on the server. */
  const startRecorder = async () => {
    setSpeechNote("Listening… (recording here; the clip is transcribed by the assistant's model)");
    const handle = await startRecording({
      onDone: async (wav, seconds) => {
        setTranscribing(true);
        setSpeechNote(`Transcribing ${Math.round(seconds)} s of audio…`);
        try {
          const form = new FormData();
          form.append("audio", wav, "speech.wav");
          form.append("lang", lang);
          const res = await fetch("/api/speech", { method: "POST", body: form });
          const body = (await res.json()) as { text?: string; message?: string };
          if (!res.ok) {
            setSpeechNote(body.message ? `Transcription failed: ${body.message}` : "Transcription failed. Try again or type.");
            return;
          }
          if (!body.text) {
            setSpeechNote("Nothing intelligible was heard. Try again or type.");
            return;
          }
          setText(`${baseText.current}${body.text}`.trim());
          setSpeechNote(null);
        } catch {
          setSpeechNote("Transcription failed. Try again or type.");
        } finally {
          setTranscribing(false);
        }
      },
      onError: (reason) => setSpeechNote(SPEECH_ERRORS[reason] ?? `Could not record (${reason}).`),
      onEnd: () => {
        setListening(false);
        recording.current = null;
      },
    });
    if (!handle) return;
    recording.current = handle;
    setListening(true);
  };

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    dictation.current?.stop();
    onSubmit(trimmed);
    setText("");
  };

  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const toggleMic = () => {
    if (listening) {
      dictation.current?.stop();
      recording.current?.stop();
      return;
    }
    if (transcribing) return;
    baseText.current = text ? `${text.trim()} ` : "";
    if (recorderPreferred()) {
      void startRecorder();
      return;
    }
    setSpeechNote("Listening… (Chrome sends the audio to Google for recognition)");
    const handle = startDictation({
      lang,
      onPartial: (partial) => setText(baseText.current + partial),
      onFinal: (final) => setText(baseText.current + final),
      onError: (reason) => {
        if (FALLBACK_TRIGGERS.has(reason) && isRecorderSupported()) {
          // Chrome cannot reach its speech service on this network: switch to the recorder
          // for this tap and remember the choice for next time.
          try {
            localStorage.setItem(VOICE_MODE_KEY, "recorder");
          } catch {
            /* cosmetic */
          }
          setSpeechNote("Chrome's speech service is unreachable; switching to local recording.");
          setTimeout(() => void startRecorder(), 400);
          return;
        }
        setSpeechNote(SPEECH_ERRORS[reason] ?? `Could not transcribe (${reason}). Try again or type.`);
      },
      onEnd: () => {
        setListening(false);
        dictation.current = null;
        setSpeechNote((note) => (note?.startsWith("Listening") ? null : note));
      },
    });
    if (!handle) {
      setSpeechNote("This browser has no speech recognition. Type instead.");
      return;
    }
    dictation.current = handle;
    setListening(true);
  };

  const pad = size === "lg" ? "px-5 py-3" : "px-4 py-2";

  return (
    <form onSubmit={submit} className="w-full" data-testid="composer">
      <div className={`flex items-end gap-2 rounded-[28px] border border-line bg-paper-2 shadow-sm ${pad} focus-within:border-money`}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className={`max-h-40 min-h-[28px] flex-1 resize-none bg-transparent text-ink outline-none placeholder:text-ink-3 ${size === "lg" ? "text-base sm:text-lg" : "text-sm"}`}
          aria-label={placeholder}
          data-testid="composer-input"
        />
        {speechOk && (
          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={listening}
            aria-busy={transcribing}
            disabled={transcribing}
            aria-label={listening ? "Stop listening" : "Speak instead of typing"}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
              listening ? "border-alarm bg-alarm-soft text-alarm" : "border-line text-ink-2 hover:bg-paper-3"
            } disabled:opacity-50`}
            data-testid="composer-mic"
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-navy px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="composer-submit"
        >
          {buttonLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      {speechNote && (
        <p className="mt-2 text-xs text-ink-3" role="status">
          {speechNote}
        </p>
      )}
    </form>
  );
}
