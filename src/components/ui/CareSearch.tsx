"use client";

import { Search, X } from "lucide-react";
import Tooltip from "./Tooltip";

const ACCENTS = {
  rose: "border-rose-200 bg-rose-50/70 focus-within:border-rose-400 focus-within:ring-rose-100",
  sky: "border-sky-200 bg-sky-50/70 focus-within:border-sky-400 focus-within:ring-sky-100",
  teal: "border-teal-200 bg-teal-50/70 focus-within:border-teal-400 focus-within:ring-teal-100",
};

export default function CareSearch({
  value,
  onChange,
  placeholder,
  resultCount,
  accent,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
  accent: keyof typeof ACCENTS;
}) {
  return (
    <section className="mb-5" aria-label="模糊搜尋">
      <label className="mb-2 block text-sm font-semibold text-stone-700" htmlFor={`care-search-${accent}`}>
        快速搜尋房間
      </label>
      <div
        className={
          "flex w-full max-w-2xl items-center gap-3 rounded-xl border-2 px-4 py-2.5 shadow-sm transition focus-within:ring-4 " +
          ACCENTS[accent]
        }
      >
        <Search className="h-5 w-5 shrink-0 text-stone-500" aria-hidden="true" />
        <input
          id={`care-search-${accent}`}
          type="text"
          inputMode="search"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-1 text-base text-stone-800 outline-none placeholder:text-stone-500"
        />
        {value && (
          <Tooltip content="清除搜尋條件並顯示全部房間">
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-white hover:text-stone-800"
              aria-label="清除搜尋"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </div>
      <p className="mt-1.5 text-xs text-stone-500">
        可輸入部分關鍵字模糊比對，目前顯示 {resultCount} 間房。
      </p>
    </section>
  );
}
