"use client";

import type { LucideIcon } from "lucide-react";

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  help?: string;
};

/** 兩～三選一的分段切換鈕；用於設定頁中「擇一生效」的顯示參數。 */
export default function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  disabled = false,
}: {
  value: T;
  onChange: (next: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded-xl border border-brand-900/10 bg-surface-muted p-1"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            disabled={disabled}
            title={option.help}
            className={
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-[color,background-color,box-shadow] " +
              (active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-stone-500 hover:bg-brand-50 hover:text-brand-600")
            }
          >
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
