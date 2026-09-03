/**
 * The product's two surfaces (plan D5). This replaces the Simple / Full-detail register
 * as the thing the header switch controls: Agentic is the chat at /app, Manual is the
 * dashboard at /. It lives on the account (`users.mode`), not in localStorage, so it
 * follows the person across browsers.
 *
 * The old register ("simple" | "full") still exists inside the manual surface's
 * components as an internal prop; manual mode renders the "simple" register, which is
 * the dashboard the user asked to keep.
 */
export type UiMode = "agentic" | "manual";

export const UI_MODES: readonly UiMode[] = ["agentic", "manual"];

export function isUiMode(value: unknown): value is UiMode {
  return value === "agentic" || value === "manual";
}

export function surfaceFor(mode: UiMode): string {
  return mode === "manual" ? "/" : "/app";
}
