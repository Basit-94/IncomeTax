"use client";

import { UI_MODES, type UiMode } from "@/lib/mode";

/** The Agentic | Manual segmented control (plan D5). Shows the surface being viewed. */
export default function ModeSwitch({
  current,
  onChange,
  labels = { agentic: "Agentic", manual: "Manual" },
}: {
  current: UiMode;
  onChange: (next: UiMode) => void;
  labels?: Record<UiMode, string>;
}) {
  return (
    <div className="seg" role="group" aria-label="Agentic or Manual" data-testid="mode-switch">
      {UI_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className="min-h-[44px] min-w-[44px]"
          aria-pressed={current === mode}
          data-mode={mode}
          onClick={() => current !== mode && onChange(mode)}
        >
          {labels[mode]}
        </button>
      ))}
    </div>
  );
}
