"use client";

import { useState } from "react";
import { Tags } from "lucide-react";
import { usePhraseLibrary } from "@/hooks/usePhraseLibrary";
import { PHRASE_CATEGORIES } from "@/lib/mock/phrases";

/**
 * 護理記錄查詢片語時要有下拉選單可選，也要能手動輸入關鍵字查詢，
 * 找出對應的片語內容（不是只能從固定分類點選）。
 * 分類改用大顆藥丸式頁籤（非下拉select），方便護理師在iPad上單手快速點選。
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
        className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700 hover:bg-sky-100"
      >
        <Tags className="h-3.5 w-3.5" />
        插入常用片語
      </button>
      {open && (
        <div className="animate-fade-in-up absolute right-0 z-20 mt-1.5 w-[min(85vw,340px)] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl">
          <div className="scroll-fade mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {["全部", ...PHRASE_CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                  (category === c ? "bg-brand-500 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200")
                }
              >
                {c}
              </button>
            ))}
          </div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="輸入關鍵字查詢（內容/標籤）"
            className="mb-2 w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm"
          />
          <ul className="scroll-fade max-h-56 space-y-1.5 overflow-y-auto">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onInsert(p.text);
                    setOpen(false);
                  }}
                  className="w-full rounded-xl border border-transparent p-2.5 text-left text-sm transition-colors hover:border-brand-200 hover:bg-brand-50 active:scale-[0.98]"
                >
                  <div className="mb-1 flex flex-wrap gap-1">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {p.category}
                    </span>
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="text-stone-700">{p.text}</div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="p-3 text-center text-xs text-stone-400">查無片語，可換個關鍵字試試</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
