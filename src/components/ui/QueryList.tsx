"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { rowMatchesQuery } from "@/lib/fuzzySearch";
import Pagination from "./Pagination";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export default function QueryList<T extends { id: string | number }>({
  columns,
  rows,
  searchPlaceholder = "輸入關鍵字查詢（支援模糊搜尋）",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = q ? rows.filter((r) => rowMatchesQuery(r as Record<string, unknown>, q)) : rows;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm sm:w-64"
        />
        <button className="rounded-lg bg-stone-700 px-4 py-2 text-sm text-white hover:bg-stone-800">
          送出查詢
        </button>
        <span className="ml-auto text-xs text-stone-400">共 {filtered.length} 筆</span>
      </div>
      <div className="scroll-fade overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-stone-50 text-xs text-stone-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-3 py-2.5 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={
                  "border-t border-stone-100 transition-colors" +
                  (onRowClick ? " cursor-pointer hover:bg-rose-50 active:bg-rose-100" : " hover:bg-stone-50")
                }
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2.5">
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-stone-400">
                  <div className="flex flex-col items-center gap-1.5">
                    <Inbox className="h-6 w-6 text-stone-300" />
                    查無資料
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={safePage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />
    </div>
  );
}
