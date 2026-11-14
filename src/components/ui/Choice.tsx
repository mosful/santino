"use client";

import { useId } from "react";

export type ChoiceOption = string | { value: string; label: string };

/**
 * 單選輸入：選項 3 個以下用 radio button（客戶 2026-11-14：少量選項不要下拉，點一下就好），
 * 4 個以上維持下拉選單。值與原 select 相同，換元件不影響資料。
 */
export default function Choice({ value, options, onChange, label, className = "", disabled = false, placeholder }: {
  value: string;
  options: readonly ChoiceOption[];
  onChange: (value: string) => void;
  /** 無障礙名稱（radio 群組的 aria-label／select 的 aria-label）。 */
  label: string;
  /** 只套在 select 上；radio 群組有自己的排版。 */
  className?: string;
  disabled?: boolean;
  /** select 的空白選項文字；radio 不顯示空白項，未選就是都不勾。 */
  placeholder?: string;
}) {
  const name = useId();
  const items = options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
  if (items.length <= 3) {
    return <div role="radiogroup" aria-label={label} className="flex min-h-12 flex-wrap items-center gap-x-5 gap-y-1">
      {items.map((item) => <label key={item.value} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input type="radio" name={name} value={item.value} checked={value === item.value} disabled={disabled} onChange={() => onChange(item.value)} className="h-5 w-5" />
        {item.label}
      </label>)}
    </div>;
  }
  return <select aria-label={label} className={className} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
  </select>;
}

/** 胎次：第 1／2／3 胎 radio，其餘可自填數字（客戶 2026-11-14）。值固定存成「第 N 胎」。 */
export function ParityInput({ value, onChange, disabled = false, label = "胎次" }: { value: string; onChange: (value: string) => void; disabled?: boolean; label?: string }) {
  const name = useId();
  const current = /(\d+)/.exec(value)?.[1] ?? "";
  const preset = ["1", "2", "3"];
  // 舊資料「第 3 胎以上」沒有確切數字，不勾任何一個，讓人員重新選。
  const custom = !preset.includes(current) || /以上/.test(value);
  return <div role="radiogroup" aria-label={label} className="flex min-h-12 flex-wrap items-center gap-x-5 gap-y-1">
    {preset.map((number) => <label key={number} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
      <input type="radio" name={name} checked={!custom && current === number} disabled={disabled} onChange={() => onChange(`第 ${number} 胎`)} className="h-5 w-5" />
      {number}
    </label>)}
    <label className="flex min-h-11 items-center gap-2 whitespace-nowrap text-sm">
      其他
      <input aria-label={`${label}（自填）`} type="number" min={1} max={20} disabled={disabled} className="form-control min-h-11 w-20 rounded-lg border border-stone-300 bg-white px-2 text-sm" value={custom ? current : ""} placeholder="胎" onChange={(event) => onChange(event.target.value ? `第 ${event.target.value} 胎` : "")} />
    </label>
  </div>;
}
