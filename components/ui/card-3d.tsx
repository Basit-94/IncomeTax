"use client";

import React, { useRef, useState, useCallback, type ReactNode } from "react";

interface Card3DProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  maxTilt?: number;
  glowColor?: string;
  depth?: number;
  as?: "div" | "button" | "article";
  tabIndex?: number;
  ariaLabel?: string;
}

export default function Card3D({
  children,
  className = "",
  onClick,
  maxTilt = 6,
  glowColor = "rgba(70, 183, 255, 0.25)",
  depth = 24,
  as: Component = "div",
  tabIndex,
  ariaLabel,
}: Card3DProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalized coordinates (-1 to 1)
      const normX = (x - centerX) / centerX;
      const normY = (y - centerY) / centerY;

      // Target rotations
      const rotX = -normY * maxTilt;
      const rotY = normX * maxTilt;

      setTilt({ x: rotX, y: rotY });
      setSpotlight({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 1,
      });
    },
    [maxTilt]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  const transformStyle = isHovered
    ? `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateZ(${depth / 3}px) scale3d(1.015, 1.015, 1.015)`
    : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)";

  return (
    <Component
      // @ts-expect-error dynamic as polymorphic ref
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      className={`relative group/3d transition-transform duration-200 ease-out will-change-transform select-none ${className}`}
      style={{
        transform: transformStyle,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Specular Top Rim Light (Scrolltide tactile border reflection) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-20"
        style={{
          boxShadow: isHovered
            ? `inset 0 1px 0 0 rgba(255, 255, 255, 0.25), 0 20px 50px -15px ${glowColor}`
            : "inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 10px 30px -10px rgba(0, 0, 0, 0.4)",
        }}
      />

      {/* Dynamic Cursor Spotlight Tracking */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover/3d:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(400px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.09), transparent 60%)`,
        }}
      />

      {/* Content wrapper with slight 3D elevation */}
      <div
        className="relative z-10 h-full w-full"
        style={{
          transform: isHovered ? `translateZ(${depth}px)` : "translateZ(0px)",
          transformStyle: "preserve-3d",
          transition: "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </Component>
  );
}
