"use client";

/**
 * Direction 13's ambient motes.
 *
 * Two user directives (2026-08-29) reshaped this from the spec's original
 * proportion-encoding:
 *  - "the bg elements are moving too fast, kinda distracting" → drift is now
 *    prototype-slow: a mote takes roughly half a minute to cross the screen.
 *  - "it needs to be multicolour" → lanes are spread EVENLY across the three
 *    money families (blue / red / green, each tinted toward its burst partner)
 *    plus a small gold sprinkle from the celebration palette. The lane split
 *    no longer encodes the user's proportions — the bar above the fold does
 *    that job with exact numbers.
 *
 * Still true to the prototype: multiply/screen blending per theme, trailing
 * echo, static field under prefers-reduced-motion, loop stops on unmount.
 */

import { useEffect, useRef } from "react";

interface Mote {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  phase: number;
  lane: 0 | 1 | 2 | 3;
  tint: number;
  alpha: number;
}

const COUNT = 200;

/** Burst-palette partners: azure / coral / mint / light gold. */
const PARTNERS: [number, number, number][] = [
  [78, 155, 255],
  [255, 107, 74],
  [53, 211, 146],
  [255, 205, 100],
];

/** Gold has no theme token; these pair with the light/dark palettes. */
const GOLD_LIGHT: [number, number, number] = [232, 163, 23];
const GOLD_DARK: [number, number, number] = [223, 168, 85];

function readLaneColors(dark: boolean): [number, number, number][] {
  const probe = document.createElement("span");
  document.body.appendChild(probe);
  const read = (name: string): [number, number, number] => {
    probe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    const m = getComputedStyle(probe).color.match(/\d+/g);
    return m ? ([+m[0], +m[1], +m[2]] as [number, number, number]) : [128, 128, 128];
  };
  const colors: [number, number, number][] = [
    read("--flow-in"),
    read("--flow-out"),
    read("--flow-keep"),
    dark ? GOLD_DARK : GOLD_LIGHT,
  ];
  probe.remove();
  return colors;
}

export default function Motes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dark = document.documentElement.classList.contains("dark-mode");
    let colors = readLaneColors(dark);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const motes: Mote[] = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      size: 1.4 + Math.random() * 2.4,
      // ~25-80 px/s at typical widths: present, never busy.
      speed: 0.00001 + Math.random() * 0.00003,
      wobble: 0.00006 + Math.random() * 0.0001,
      phase: Math.random() * Math.PI * 2,
      // even thirds across the money families, every 12th mote gold
      lane: (i % 12 === 11 ? 3 : i % 3) as Mote["lane"],
      tint: Math.random() * 0.85,
      alpha: 0.14 + Math.random() * 0.28,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (tick: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = dark ? "screen" : "multiply";
      for (const mote of motes) {
        const base = colors[mote.lane];
        const partner = PARTNERS[mote.lane];
        const rgb = base.map((v, i) => Math.round(v + (partner[i] - v) * mote.tint));
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${mote.alpha})`;
        const x = ((mote.x + tick * mote.speed) % 1 + 1) % 1 * canvas.width;
        const y = (mote.y + Math.sin(tick * mote.wobble + mote.phase) * 0.012) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, mote.size, 0, Math.PI * 2);
        ctx.fill();
        // the prototype's trailing echo - what makes the field read as drift
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${mote.alpha * 0.24})`;
        ctx.beginPath();
        ctx.arc(x - mote.size * 4, y, mote.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    let raf = 0;
    if (reduce) {
      draw(0);
    } else {
      const loop = (time: number) => {
        draw(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    const observer = new MutationObserver(() => {
      dark = document.documentElement.classList.contains("dark-mode");
      colors = readLaneColors(dark);
      if (reduce) draw(0);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none print:hidden"
      style={{ zIndex: -1 }}
    />
  );
}
