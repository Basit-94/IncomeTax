"use client";

import React, { useRef } from "react";
import { m, useScroll, useTransform } from "motion/react";

// --- SCROLL SCATTER & GATHER 3D ANIMATION WRAPPER ---
export default function ScrollScatter3D({ 
  children, 
  xOffset = 0, 
  yOffset = 0, 
  zOffset = 0,
  rotateXOffset = 0,
  rotateYOffset = 0,
  rotateZOffset = 0
}: { 
  children: React.ReactNode; 
  xOffset?: number; 
  yOffset?: number; 
  zOffset?: number;
  rotateXOffset?: number;
  rotateYOffset?: number;
  rotateZOffset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const x = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [xOffset, 0, 0, -xOffset]);
  const y = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [yOffset, 0, 0, -yOffset]);
  const z = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [zOffset, 0, 0, -zOffset]);
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [rotateXOffset, 0, 0, -rotateXOffset]);
  const rotateY = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [rotateYOffset, 0, 0, -rotateYOffset]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [rotateZOffset, 0, 0, -rotateZOffset]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return (
    <m.div
      ref={ref}
      style={{ x, y, z, rotateX, rotateY, rotate: rotateZ, opacity }}
      className="will-change-transform"
    >
      {children}
    </m.div>
  );
}
