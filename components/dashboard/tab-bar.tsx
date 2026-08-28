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
    <div className="nav-d13 border-b-2 border-[color:var(--edge-color)] flex items-center gap-2 text-ink-2 print:hidden">
      <button 
        onClick={() => setActiveTab("overview")}
        className={`px-2.5 py-2 rounded-[3px] border transition-colors flex items-center gap-1.5 ${
          activeTab === "overview" ? "border-[color:var(--edge-color)] bg-paper-2 text-ink" : "border-transparent hover:border-[color:var(--edge-color)] hover:text-ink"
        }`}
      >
        <Grid size={16} />
        <span>{t.dashboard.userDashboard}</span>
      </button>

      <button 
        onClick={() => setActiveTab("statement")}
        className={`px-2.5 py-2 rounded-[3px] border transition-colors flex items-center gap-1.5 ${
          activeTab === "statement" ? "border-[color:var(--edge-color)] bg-paper-2 text-ink" : "border-transparent hover:border-[color:var(--edge-color)] hover:text-ink"
        }`}
      >
        <FileText size={16} />
        <span>{t.dashboard.taxPrefills}</span>
      </button>

      <button 
        onClick={() => setActiveTab("actions")}
        className={`px-2.5 py-2 rounded-[3px] border transition-colors flex items-center gap-1.5 relative ${
          activeTab === "actions" ? "border-[color:var(--edge-color)] bg-paper-2 text-ink" : "border-transparent hover:border-[color:var(--edge-color)] hover:text-ink"
        }`}
      >
        <ShieldAlert size={16} />
        <span>{t.dashboard.pendingActions}</span>
        {noticeCount > 0 && (
          <span className="absolute -top-1.5 -right-3 w-4 h-4 bg-alarm text-paper text-[0.6rem] font-bold rounded-full flex items-center justify-center">
            {noticeCount}
          </span>
        )}
      </button>

    </div>
  );
}
