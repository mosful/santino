"use client";

import { LayoutDashboard, Route } from "lucide-react";
import {
  setDashboardLayout,
  useDashboardLayout,
  type DashboardLayout,
} from "@/lib/dashboardLayoutStore";

const OPTIONS: { value: DashboardLayout; label: string; shortLabel: string; icon: typeof LayoutDashboard }[] = [
  { value: "journey", label: "流程中控", shortLabel: "流程", icon: Route },
  { value: "classic", label: "原中控", shortLabel: "原版", icon: LayoutDashboard },
];

export default function DashboardLayoutSwitch() {
  const layout = useDashboardLayout();

  return (
    <div className="flex items-center rounded-xl border border-brand-900/10 bg-white p-1 shadow-sm" aria-label="中控版型切換">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = layout === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setDashboardLayout(option.value)}
            aria-pressed={active}
            title={`切換為${option.label}`}
            className={
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all " +
              (active ? "bg-brand-500 text-white shadow-sm" : "text-stone-500 hover:bg-brand-50 hover:text-brand-600")
            }
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
