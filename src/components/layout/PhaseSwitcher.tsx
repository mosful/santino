"use client";

import { Layers3 } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import { setEnabledPhase, useEnabledPhase, type EnabledPhase } from "@/lib/phaseStore";

const OPTIONS: { phase: EnabledPhase; label: string; help: string }[] = [
  { phase: 1, label: "Phase 1", help: "只顯示第一階段核心功能選單" },
  { phase: 2, label: "Phase 1＋2", help: "顯示第一、二階段功能選單" },
];

export default function PhaseSwitcher() {
  const enabledPhase = useEnabledPhase();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-brand-900/10 bg-white p-1 shadow-sm">
      <Layers3 className="mx-0.5 h-4 w-4 text-brand-500 sm:mx-1" aria-hidden="true" />
      {OPTIONS.map((option) => (
        <Tooltip key={option.phase} content={option.help}>
          <button
            type="button"
            onClick={() => setEnabledPhase(option.phase)}
            aria-pressed={enabledPhase === option.phase}
            className={
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
              (enabledPhase === option.phase
                ? "bg-brand-500 text-white"
                : "text-stone-500 hover:bg-brand-50 hover:text-brand-600")
            }
          >
            <span className="sm:hidden">{option.phase === 1 ? "P1" : "P1＋2"}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
