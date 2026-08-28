"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { usePhraseLibrary } from "@/hooks/usePhraseLibrary";
import { PHRASE_CATEGORIES } from "@/lib/mock/phrases";

/**
 * 護理記錄查詢片語時要有下拉選單可選，也要能手動輸入關鍵字查詢，
 * 找出對應的片語內容（不是只能從固定分類點選）。
 */
export default function PhrasePicker({ onInsert }: { onInsert: (text: string) => void }) {
  const { phrases } = usePhraseLibrary();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("全部");
  const [keyword, setKeyword] = useState("");

  const filtered = phrases.filter((p) => {
    if (category !== "全部" && p.category !== category) return false;
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      p.text.toLowerCase().includes(kw) ||
      p.tags.some((t) => t.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
      >
        🏷️ 插入常用片語
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex gap-1.5">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
            >
              <option>全部</option>
              {PHRASE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="輸入關鍵字查詢（內容/標籤）"
            className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          />
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onInsert(p.text);
                    setOpen(false);
                  }}
                  className="w-full rounded-lg p-2 text-left text-xs hover:bg-rose-50"
                >
                  <div className="mb-0.5 flex flex-wrap gap-1">
                    <Badge color="amber">{p.category}</Badge>
                    {p.tags.map((t) => (
                      <Badge key={t} color="purple">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-slate-700">{p.text}</div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="p-2 text-center text-xs text-slate-400">查無片語</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
