"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection } | null;

/* 中文姓名、房號與「3 天／12 天」這種混合字串都要排得合理，所以用 collator 而不是 <。 */
const collator = new Intl.Collator("zh-Hant", { numeric: true, sensitivity: "base" });
const isEmpty = (value: unknown) => value === undefined || value === null || value === "";

export function compareValues(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return collator.compare(String(left), String(right));
}

/**
 * 依指定欄位排出新陣列；sort 為 null 時保留原順序。
 *
 * 空值一律排最後（不跟著遞減翻到最前面）——否則「依簽約日排序」第一頁會全是尚未簽約的案件。
 */
export function sortRows<T>(rows: T[], sort: SortState, getValue: (row: T, key: string) => unknown) {
  if (!sort) return rows;
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = getValue(a, sort.key);
    const right = getValue(b, sort.key);
    if (isEmpty(left) || isEmpty(right)) return isEmpty(left) === isEmpty(right) ? 0 : isEmpty(left) ? 1 : -1;
    return compareValues(left, right) * factor;
  });
}

/** 清單表頭排序：點欄位標題在遞增與遞減之間切換，換欄位時從遞增開始。 */
export function useTableSort<T>(
  rows: T[],
  getValue: (row: T, key: string) => unknown = (row, key) => (row as Record<string, unknown>)[key],
  /** 進畫面時的預設排序；沒給就維持資料原本的順序。 */
  initial: SortState = null,
) {
  const [sort, setSort] = useState<SortState>(initial);
  const sorted = useMemo(() => sortRows(rows, sort, getValue), [rows, sort, getValue]);
  function toggle(key: string) {
    // 刻意只有遞增／遞減兩段：多一個「回到原順序」會讓預設已排序的欄位第一下沒反應。
    setSort((current) => ({ key, direction: current?.key === key && current.direction === "asc" ? "desc" : "asc" }));
  }
  return { sorted, sort, toggle };
}

/** 可排序的表頭儲存格；sortable 設 false 時維持原本的純文字表頭（例如「操作」欄）。 */
export default function SortableHeader({ label, columnKey, sort, onToggle, sortable = true, className = "whitespace-nowrap px-3 py-2.5 font-medium", children }: {
  label?: string;
  columnKey: string;
  sort: SortState;
  onToggle: (key: string) => void;
  sortable?: boolean;
  /** 整個 th 的樣式；各清單的 padding 不同，所以可完全覆寫。 */
  className?: string;
  children?: React.ReactNode;
}) {
  const content = children ?? label;
  const active = sort?.key === columnKey;
  const base = className;
  if (!sortable) return <th className={base}>{content}</th>;
  const Icon = active ? (sort!.direction === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th className={base} aria-sort={active ? (sort!.direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onToggle(columnKey)}
        title={`依${label ?? columnKey}排序`}
        /* 不要用 -mx-1／w-full 撐滿儲存格，也不要 whitespace-nowrap：
           平板與手機有一條 `table[class*="min-w-["] { min-width: 0 }` 讓寬表縮回容器寬度，
           表頭只要不能換行，表格就縮不回去，整頁會多出水平捲軸（e2e 驗到）。 */
        className={`inline-flex min-h-8 items-center gap-1 text-left hover:text-stone-700 ${active ? "text-brand-700" : ""}`}
      >
        <span>{content}</span>
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "" : "opacity-40"}`} aria-hidden="true" />
      </button>
    </th>
  );
}
