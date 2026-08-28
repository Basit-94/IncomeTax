"use client";

/**
 * Direction 13's celebration, ported without p5: one burst on its own fixed
 * layer above the panels (§4 layer stack, z-70). The palette is the prototype's
 * CONFETTI array verbatim — blue/azure, red/coral, green/mint, gold — chosen
 * uniformly per particle. The canvas draws only while particles live and the
 * component renders nothing at all under prefers-reduced-motion; weight
 * proportional to stakes, cost proportional to nothing (§7, §8).
 */

import { useEffect, useRef } from "react";

const CONFETTI: [number, number, number][] = [
  [26, 111, 224], [78, 155, 255],
  [222, 64, 37], [255, 107, 74],
  [20, 155, 103], [53, 211, 146],
  [232, 163, 23],
];

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

/** Mount it when the celebrated thing happens; it bursts once and goes quiet. */
export default function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: Piece[] = Array.from({ length: 160 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const speed = 7 + Math.random() * 9;
      return {
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
        y: canvas.height * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
        life: 1,
      };
    });

    let raf = 0;
    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of pieces) {
        if (p.life <= 0) continue;
        p.vy += 0.28;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > canvas.height * 0.72) p.life -= 0.03;
        if (p.life <= 0) continue;
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      // idle canvas costs nothing: stop the loop when the last piece dies (§8)
      if (alive > 0) raf = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[70] pointer-events-none print:hidden"
    />
  );
}
