"use client";

import React, { useEffect, useRef } from "react";
import { animate } from "animejs";

// --- ANIME.JS INTERACTIVE 3D LENS BACKGROUND ---
export function AnimeLens() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const waveDotsRef = useRef<SVGPathElement>(null);
  const waveGridRef = useRef<SVGGElement>(null);

  useEffect(() => {
    // 1. Rotate the glowing outer rings
    if (ringRef.current) {
      animate(ringRef.current, {
        rotate: 360,
        duration: 15000,
        loop: true,
        easing: "linear",
      });
    }

    // 2. Animate the dotted waveform
    if (waveDotsRef.current) {
      animate(waveDotsRef.current, {
        strokeDashoffset: [0, -100],
        duration: 2000,
        loop: true,
        easing: "linear",
      });
    }

    // 3. Pulse grid lines
    if (waveGridRef.current) {
      const paths = waveGridRef.current.querySelectorAll("path");
      animate(paths, {
        opacity: [0.3, 0.8, 0.3],
        delay: (el, i) => (i ?? 0) * 100,
        duration: 2000,
        loop: true,
        easing: "easeInOutQuad",
      });
    }

    // 4. Cylinder breathing movement
    if (containerRef.current) {
      animate(containerRef.current, {
        translateY: [0, -12, 0],
        rotateZ: [0, 1.5, 0],
        duration: 6000,
        loop: true,
        easing: "easeInOutQuad",
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-[480px] aspect-square relative select-none">
      <svg
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <linearGradient id="cylBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a3836" />
            <stop offset="30%" stopColor="#2c2a28" />
            <stop offset="70%" stopColor="#1e1d1c" />
            <stop offset="100%" stopColor="#121111" />
          </linearGradient>

          <linearGradient id="peachHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffb3a7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffd3b6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#252423" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="glowingRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />   {/* Green */}
            <stop offset="30%" stopColor="#f59e0b" />  {/* Yellow */}
            <stop offset="60%" stopColor="#ff4b4b" />  {/* Red */}
            <stop offset="85%" stopColor="#3b82f6" />  {/* Blue */}
            <stop offset="100%" stopColor="#10b981" /> {/* Green */}
          </linearGradient>

          <radialGradient id="lensInterior" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#221111" />
            <stop offset="80%" stopColor="#140d0d" />
            <stop offset="100%" stopColor="#0b0808" />
          </radialGradient>
        </defs>

        {/* Cylinder shadow */}
        <path
          d="M 120,380 L 350,150 L 520,270 L 290,500 Z"
          fill="#1c1a19"
          opacity="0.6"
          filter="blur(15px)"
        />

        {/* Cylinder Main Body */}
        <path
          d="M 105,335 C 75,395 115,465 195,495 C 275,525 360,505 390,445 L 530,305 C 560,245 520,175 440,145 C 360,115 275,135 245,195 Z"
          fill="url(#cylBodyGrad)"
          stroke="#4a4745"
          strokeWidth="2"
        />

        {/* Longitudinal details */}
        <path d="M 245,195 L 105,335" stroke="#121111" strokeWidth="3" />
        <path d="M 320,250 L 180,390" stroke="#121111" strokeWidth="2" />
        <path d="M 375,295 L 235,435" stroke="#121111" strokeWidth="2" />
        <path d="M 440,145 L 300,285" stroke="#121111" strokeWidth="3" />
        <path d="M 530,305 L 390,445" stroke="#121111" strokeWidth="3" />

        {/* Back cap ridge */}
        <path
          d="M 245,195 C 275,135 360,115 440,145 C 520,175 560,245 530,305"
          stroke="#5b5855"
          strokeWidth="3"
          fill="none"
          opacity="0.8"
        />
        
        {/* Shading/Highlights */}
        <path
          d="M 245,195 L 105,335 C 130,310 200,290 280,310 L 395,190 Z"
          fill="url(#peachHighlight)"
          opacity="0.75"
        />

        {/* Front collar and ridges */}
        <path
          d="M 115,325 C 145,265 230,245 310,275 C 390,305 430,375 400,435"
          stroke="#1a1918"
          strokeWidth="10"
          strokeDasharray="4 2"
          fill="none"
        />
        <path
          d="M 105,335 C 75,395 115,465 195,495 C 275,525 360,505 390,445 C 420,385 380,315 300,285 C 220,255 135,275 105,335 Z"
          fill="#1c1a19"
          stroke="#4a4745"
          strokeWidth="3"
        />

        {/* Lens Face */}
        <g transform="translate(247, 390) rotate(21.5)">
          <ellipse cx="0" cy="0" rx="145" ry="110" fill="#141312" stroke="#5b5855" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="138" ry="103" fill="#0f0e0d" stroke="#252423" strokeWidth="4" />

          {/* Rotating Neon Ring */}
          <g ref={ringRef}>
            <ellipse
              cx="0"
              cy="0"
              rx="130"
              ry="95"
              fill="none"
              stroke="url(#glowingRingGrad)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
          </g>

          <ellipse cx="0" cy="0" rx="122" ry="87" fill="url(#lensInterior)" />

          {/* Red Waveform system */}
          <g ref={waveGridRef} opacity="0.65">
            <path d="M -40,-45 L 40,-45" stroke="#ff4b4b" strokeWidth="1" />
            <path d="M -60,-35 L 60,-35" stroke="#ff4b4b" strokeWidth="1" />
            <path d="M -80,-25 L 80,-25" stroke="#ff4b4b" strokeWidth="1.5" />
            <path d="M -95,-15 L 95,-15" stroke="#ff4b4b" strokeWidth="1.5" />
            <path d="M -105,-5 L 105,-5" stroke="#ff4b4b" strokeWidth="2" />
            <path d="M -108,5 L 108,5" stroke="#ff4b4b" strokeWidth="2" />
            <path d="M -100,15 L 100,15" stroke="#ff4b4b" strokeWidth="1.5" />
            <path d="M -85,25 L 85,25" stroke="#ff4b4b" strokeWidth="1.5" />
            <path d="M -65,35 L 65,35" stroke="#ff4b4b" strokeWidth="1" />
            <path d="M -45,45 L 45,45" stroke="#ff4b4b" strokeWidth="1" />
          </g>

          {/* Dotted Sine Wave */}
          <path
            ref={waveDotsRef}
            d="M -110,35 Q -70,-60 -20,-10 T 30,-30 T 80,10 T 110,-15"
            fill="none"
            stroke="#ff4b4b"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="1 10"
            strokeDashoffset="0"
          />

          <path
            d="M -100,0 C -50,60 50,-60 100,0"
            stroke="#ff6f6f"
            strokeWidth="0.75"
            strokeDasharray="2 4"
            opacity="0.4"
          />

          {/* Reflections */}
          <path
            d="M -105,-45 A 115 80 0 0 1 105,-45"
            stroke="#ffffff"
            strokeWidth="3"
            fill="none"
            opacity="0.15"
            strokeLinecap="round"
          />
          <path
            d="M -90,-50 A 105 70 0 0 1 90,-50"
            stroke="#ffffff"
            strokeWidth="1.5"
            fill="none"
            opacity="0.1"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
