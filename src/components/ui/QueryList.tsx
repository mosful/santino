"use client";

import { useState } from "react";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export default function QueryList<T extends { id: string | number }>({
  columns,
  rows,
  searchPlaceholder = "輸入關鍵字查詢",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = q
    ? rows.filter((r) =>
        Object.values(r as Record<string, unknown>).some((v) =>
          String(v ?? "").toLowerCase().includes(q.toLowerCase())
        )
      )
    : rows;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-64 rounded border border-slate-200 px-3 py-1.5 text-sm"
        />
        <button className="rounded bg-slate-700 px-3 py-1.5 text-xs text-white">
          送出查詢
        </button>
        <span className="ml-auto text-xs text-slate-400">
          共 {filtered.length} 筆
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={
                  "border-t border-slate-100" +
                  (onRowClick ? " cursor-pointer hover:bg-rose-50" : "")
                }
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2">
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">
                  查無資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
