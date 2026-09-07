"use client";

/**
 * The Manual mode's bottom tab bar on phones (handoff 2, M5/M6): Overview · Statement · Actions · Vault,
 * 20 px icons over 11 px labels, the active tab in the accent, a red count on Actions, paper at 90 % with a
 * blur, a hairline on top and 26 px of bottom padding for the home indicator. Hidden from `md` up, where
 * the dashboard's own tab pill and the header carry the same navigation. A div with the navigation role, not
 * a <nav>: d13.css styles the bare element (sticky bar, rule, paper background) unlayered, which would beat `fixed`.
 */

import type { ReactNode } from "react";

export type MobileTab = "overview" | "statement" | "actions" | "vault";

export interface MobileTabItem {
  id: MobileTab;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export interface MobileTabBarProps {
  items: MobileTabItem[];
  active: MobileTab | null;
  onSelect: (id: MobileTab) => void;
  label: string;
}

export default function MobileTabBar({ items, active, onSelect, label }: MobileTabBarProps) {
  return (
    <div
      role="navigation"
      aria-label={label}
      className="md:hidden fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-paper/90 backdrop-blur-[16px] px-4 pt-2.5 pb-[26px] print:hidden"
      data-testid="mobile-tab-bar"
    >
      {items.map((item) => {
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={selected ? "page" : undefined}
            className={`relative flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-[3px] text-[11px] font-bold cursor-pointer ${
              selected ? "text-money" : "text-ink-3 hover:text-ink"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge ? (
              <span className="absolute -top-0.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-bad text-[9px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
