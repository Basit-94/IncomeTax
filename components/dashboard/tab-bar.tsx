"use client";

import { Grid, FileText, ShieldAlert } from "lucide-react";
import type { Dict } from "../../lib/i18n";

export type DashboardTab = "overview" | "statement" | "actions";

interface TabBarProps {
  t: Dict;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  noticeCount: number;
}

export default function TabBar({ t, activeTab, setActiveTab, noticeCount }: TabBarProps) {
  return (
    <div className="glass-flat hidden md:inline-flex items-center gap-1.5 rounded-[18px] p-[5px] text-sm font-bold text-ink-3 print:hidden">
      <button 
        onClick={() => setActiveTab("overview")}
        className={`h-10 px-4 rounded-[13px] transition-colors flex items-center gap-2 cursor-pointer ${
          activeTab === "overview" ? "ink-surface" : "hover:text-ink"
        }`}
      >
        <Grid size={16} />
        <span>{t.dashboard.userDashboard}</span>
      </button>

      <button 
        onClick={() => setActiveTab("statement")}
        className={`h-10 px-4 rounded-[13px] transition-colors flex items-center gap-2 cursor-pointer ${
          activeTab === "statement" ? "ink-surface" : "hover:text-ink"
        }`}
      >
        <FileText size={16} />
        <span>{t.dashboard.taxPrefills}</span>
      </button>

      <button 
        onClick={() => setActiveTab("actions")}
        className={`h-10 px-4 rounded-[13px] transition-colors flex items-center gap-2 relative cursor-pointer ${
          activeTab === "actions" ? "ink-surface" : "hover:text-ink"
        }`}
      >
        <ShieldAlert size={16} />
        <span>{t.dashboard.pendingActions}</span>
        {noticeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-bad text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {noticeCount}
          </span>
        )}
      </button>

    </div>
  );
}
