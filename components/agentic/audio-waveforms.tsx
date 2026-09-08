"use client";

import { useEffect, useRef, useState } from "react";
import { MicOff, X, Sparkles } from "lucide-react";
import { m } from "motion/react";
import { Munshi } from "../brand/munshi";

interface SpeakingWaveformProps {
  audioLevel: number;
  timeSeconds: number;
  onStop: () => void;
  onCancel: () => void;
  langLabel?: string;
}

const BARS_COUNT = 24;

/**
 * Audio Waveform when user is speaking.
 * Displays real-time audio reactivity with symmetrical bell-curve equalization,
 * live timer, and Sunrise/Lilac + Navy & Coral styling (docs/DESIGN.md).
 */
export function SpeakingWaveform({
  audioLevel,
  timeSeconds,
  onStop,
  onCancel,
}: SpeakingWaveformProps) {
  // Smooth animated levels for each bar
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array.from({ length: BARS_COUNT }, () => 6)
  );
  const animFrame = useRef<number>(0);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    const updateBars = () => {
      if (!active) return;
      phaseRef.current += 0.08;

      setBarHeights((prev) =>
        prev.map((_, i) => {
          // Bell curve weight (center bars are naturally taller)
          const distFromCenter = Math.abs(i - (BARS_COUNT - 1) / 2) / (BARS_COUNT / 2);
          const weight = Math.cos(distFromCenter * (Math.PI / 2.2));
          
          // Organic idle wave oscillation
          const idleWave = Math.sin(phaseRef.current + i * 0.45) * 3 + 5;
          
          // Dynamic volume reaction
          const target = idleWave + audioLevel * weight * 32;
          
          // Smooth spring-like lerp
          return Math.max(4, Math.min(36, target));
        })
      );

      animFrame.current = requestAnimationFrame(updateBars);
    };

    animFrame.current = requestAnimationFrame(updateBars);
    return () => {
      active = false;
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [audioLevel]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className="flex w-full items-center justify-between gap-3 px-2 py-1 select-none min-h-[44px]"
      role="region"
      aria-label="Audio recording active"
    >
      {/* Left: Status indicator & Live counter */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Munshi size={38} compact state="voice" />
        <div className="relative flex size-3 items-center justify-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--primary-accent)] opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[var(--primary-accent)] shadow-[0_0_8px_var(--primary-accent)]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--primary-accent)]">
              LIVE
            </span>
            <span className="font-mono text-[12px] font-bold tabular-nums text-ink-2">
              {formatTime(timeSeconds)}
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] font-medium text-ink-3">
            Listening…
          </span>
        </div>
      </div>

      {/* Center: Live Audio Waveform Bars */}
      <div
        className="flex flex-1 items-center justify-center gap-[2.5px] sm:gap-[3.5px] h-10 px-2 overflow-hidden"
        aria-hidden="true"
      >
        {barHeights.map((h, i) => (
          <m.div
            key={i}
            className="w-[2.5px] sm:w-[3.5px] rounded-full transition-[height] duration-75 ease-out"
            style={{
              height: `${h}px`,
              background: `linear-gradient(to top, var(--primary-accent), var(--soft-color), var(--tertiary-color))`,
              boxShadow: h > 14 ? "0 0 6px var(--primary-accent)" : "none",
            }}
          />
        ))}
      </div>

      {/* Right: Actions (Cancel & Done) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="size-9 rounded-[11px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-paper-2 transition-colors cursor-pointer"
          aria-label="Cancel recording"
          title="Cancel"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onStop}
          className="h-[38px] px-3.5 rounded-[12px] flex items-center gap-1.5 font-bold text-xs bg-[var(--primary-accent)] text-white hover:brightness-110 active:scale-95 transition-all shadow-[var(--accent-glow)] cursor-pointer"
          aria-label="Stop recording and transcribe"
          title="Done speaking"
        >
          <MicOff size={14} aria-hidden="true" />
          <span className="hidden xs:inline">Done</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Transcribing Animation when audio is being processed.
 * Features a distinct flowing harmonic sine ribbon, radiant traveling gradient sweep,
 * and  AI processing indicators matching Sunrise/Lilac + Navy & Coral (docs/DESIGN.md).
 */
export function TranscribingAnimation() {
  return (
    <div
      className="relative flex w-full items-center justify-between gap-3 px-3 py-1.5 overflow-hidden rounded-[14px] min-h-[44px] select-none"
      role="status"
      aria-live="polite"
      aria-label="Transcribing audio"
    >
      {/* Background traveling shimmer beam */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-30 animate-pulse"
        style={{
          background: `radial-gradient(circle at 50% 50%, var(--accent-soft-bg), transparent 75%)`,
        }}
      />

      {/* Left: Gemini processing badge */}
      <div className="relative flex items-center gap-2.5 z-10 shrink-0">
        <div className="size-7 rounded-[9px] flex items-center justify-center bg-[var(--accent-soft-bg)] text-[var(--primary-accent)] shadow-sm">
          <m.div
            animate={{ rotate: [0, 180, 360], scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          >
            <Sparkles size={15} />
          </m.div>
        </div>
        <div className="flex flex-col">
          <span className="text-[13.5px] font-bold text-ink leading-tight flex items-center gap-1.5">
            Transcribing
            <span className="inline-flex size-1.5 rounded-full bg-[var(--primary-accent)] animate-ping" />
          </span>
          <span className="text-[11px] font-mono text-[var(--primary-accent)] font-semibold uppercase tracking-wider">
            Whisper Audio AI
          </span>
        </div>
      </div>

      {/* Center: Munshi ji reading the report animation */}
      <div className="relative flex-1 flex items-center justify-center gap-2.5 h-10 px-2 overflow-hidden z-10">
        <Munshi size={42} compact state="reading" />
        <span className="text-xs font-semibold text-ink-2 truncate hidden sm:inline">
          Munshi ji is reading & structuring transcript…
        </span>
      </div>

      {/* Right: Pulsing status dots */}
      <div className="flex items-center gap-1 shrink-0 z-10">
        {[0, 1, 2].map((dot) => (
          <m.span
            key={dot}
            className="size-1.5 rounded-full bg-[var(--primary-accent)]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.2, 0.85] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              delay: dot * 0.25,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
