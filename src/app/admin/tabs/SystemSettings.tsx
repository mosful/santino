"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import { setEnabledPhase, useEnabledPhase, type EnabledPhase } from "@/lib/phaseStore";

const PHASE_OPTIONS = [
  { value: 1 as EnabledPhase, label: "Phase 1", help: "只顯示第一階段核心功能選單" },
  { value: 2 as EnabledPhase, label: "Phase 1＋2", help: "顯示第一、二階段功能選單" },
];

export default function SystemSettings() {
  const enabledPhase = useEnabledPhase();

  return (
    <div className="max-w-3xl space-y-4 text-sm">
      <section className="rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs">
        <h3 className="text-sm font-semibold text-stone-700">介面顯示設定</h3>
        <p className="mt-1 text-xs text-stone-500">僅影響本機瀏覽器的顯示方式，不會變更任何院務資料。</p>

        <dl className="mt-4 divide-y divide-stone-200">
          <SettingRow
            term="功能分期顯示"
            description="控制側邊選單顯示到哪一個開發階段；Phase 1＋2 會同時包含第一階段功能。"
          >
            <SegmentedControl
              ariaLabel="功能分期顯示"
              value={enabledPhase}
              onChange={setEnabledPhase}
              options={PHASE_OPTIONS}
            />
          </SettingRow>
        </dl>
      </section>

    </div>
  );
}

function SettingRow({
  term,
  description,
  children,
}: {
  term: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 max-w-sm">
        <dt className="text-xs font-semibold text-stone-700">{term}</dt>
        <dd className="mt-0.5 text-xs leading-5 text-stone-500">{description}</dd>
      </div>
      {children}
    </div>
  );
}
