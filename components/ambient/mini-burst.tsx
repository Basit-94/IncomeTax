"use client";

/**
 * A small, rewarding confetti pop for micro-wins — "with each claim-this click,
 * a little confetti; not too much, not distracting" (user, 2026-08-29).
 *
 * One fixed canvas hosts every burst. Fire one with `fireMiniBurst(x, y)`
 * (viewport coordinates — pass the clicked button's centre). ~22 pieces from
 * the D13 celebration palette, gone in under a second; the RAF loop stops the
 * moment the last piece dies, and nothing renders at all under
 * prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";

const EVENT = "wapsi:miniburst";

const PALETTE: [number, number, number][] = [
  [26, 111, 224], [78, 155, 255],
  [222, 64, 37], [255, 107, 74],
  [20, 155, 103], [53, 211, 146],
  [232, 163, 23],
];

export function fireMiniBurst(x: number, y: number) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { x, y } }));
}

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: [number, number, number];
  life: number;
}

export default function MiniBurstHost() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let pieces: Piece[] = [];
    let raf = 0;
    let running = false;

    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces = pieces.filter((p) => p.life > 0);
      for (const p of pieces) {
        p.vy += 0.22;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.028;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (pieces.length > 0) {
        raf = requestAnimationFrame(step);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const onBurst = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      for (let i = 0; i < 22; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
        const speed = 2.5 + Math.random() * 4.5;
        pieces.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: 3 + Math.random() * 4,
          h: 5 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.35,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          life: 1,
        });
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };

    window.addEventListener(EVENT, onBurst);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(EVENT, onBurst);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[70] pointer-events-none print:hidden"
    />
  );
}
