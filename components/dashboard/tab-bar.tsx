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
    <div className="border-b border-line flex space-x-6 text-sm font-semibold text-ink-2 print:hidden">
      <button 
        onClick={() => setActiveTab("overview")}
        className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
          activeTab === "overview" ? "border-navy text-navy font-bold" : "border-transparent hover:text-ink hover:border-line"
        }`}
      >
        <Grid size={16} />
        <span>{t.dashboard.userDashboard}</span>
      </button>

      <button 
        onClick={() => setActiveTab("statement")}
        className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
          activeTab === "statement" ? "border-navy text-navy font-bold" : "border-transparent hover:text-ink hover:border-line"
        }`}
      >
        <FileText size={16} />
        <span>{t.dashboard.taxPrefills}</span>
      </button>

      <button 
        onClick={() => setActiveTab("actions")}
        className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 relative ${
          activeTab === "actions" ? "border-navy text-navy font-bold" : "border-transparent hover:text-ink hover:border-line"
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
