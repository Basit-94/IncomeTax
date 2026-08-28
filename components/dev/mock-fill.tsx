"use client";

import { MOCK, MOCK_MODE, type MockKey } from "./mock-data";

/**
 * Tester affordance: fills one field with its hard-coded mock value.
 *
 * Deliberately quiet — it sits at ~40% opacity until hovered, so it stays out of the way while
 * judging the real design, and is still one click away when walking the flows. It is
 * `tabIndex={-1}` on purpose: a tester keyboarding down a form should not land on a fill button
 * between every field.
 *
 * Renders nothing when NEXT_PUBLIC_MOCK_MODE="false".
 */
export function MockFill({
  onFill,
  label = "fill",
  title,
  className = "",
}: {
  onFill: () => void;
  label?: string;
  title?: string;
  className?: string;
}) {
  if (!MOCK_MODE) return null;
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onFill}
      title={title ?? "Fill this field with mock test data"}
      aria-label={title ?? "Fill this field with mock test data"}
      className={
        "absolute -top-5 right-0 z-10 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase " +
        "tracking-wider text-ink-3 opacity-40 transition hover:bg-paper-2 hover:text-ink " +
        "hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-1 " +
        className
      }
    >
      {label}
    </button>
  );
}

/**
 * Wraps a single field so {@link MockFill} can position against it. Use when the input is not
 * already inside a positioned container.
 */
export function MockField({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={"relative " + className}>{children}</div>;
}

/**
 * Fills a whole step at once — the fastest path through a flow. Give it the setter and a record
 * of field-name to mock value.
 */
export function MockFillAll({
  onFill,
  label = "fill this step",
  className = "",
}: {
  onFill: () => void;
  label?: string;
  className?: string;
}) {
  if (!MOCK_MODE) return null;
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onFill}
      title="Fill every field on this step with mock test data"
      aria-label="Fill every field on this step with mock test data"
      className={
        "rounded-md border border-dashed border-line px-2 py-1 font-mono text-[10px] uppercase " +
        "tracking-wider text-ink-3 opacity-60 transition hover:border-ink-3 hover:text-ink " +
        "hover:opacity-100 " + className
      }
    >
      ⚡ {label}
    </button>
  );
}

export { MOCK, type MockKey };
