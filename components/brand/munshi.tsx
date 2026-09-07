"use client";
import { useId, type ReactNode } from "react";
import { MunshiArt, type MunshiState } from "./munshi-art";
export type { MunshiState } from "./munshi-art";
export interface MunshiProps { size?: number; className?: string; title?: string; state?: MunshiState; animated?: boolean; compact?: boolean; }
/** One editable vector rig for the website and downloadable SVGs. */
export function Munshi({ size = 34, className = "", title, state = "idle", animated = true, compact = false }: MunshiProps) {
  const id = `munshi-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return <MunshiArt id={id} size={size} state={state} title={title} animated={animated} compact={compact} className={`shrink-0 ${className}`} />;
}
export function MunshiAvatar({ size = 36, className = "", state = "idle", animated = true }: Omit<MunshiProps, "compact" | "title">) {
  return <span className={`glass-avatar shrink-0 rounded-full flex items-center justify-center overflow-hidden ${className}`} style={{ width: size, height: size }} aria-hidden="true"><Munshi size={size} compact state={state} animated={animated} /></span>;
}
export function MunshiBubble({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`munshi-bubble ${className}`}>{children}</div>;
}
