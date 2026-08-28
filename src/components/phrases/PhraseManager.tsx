"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { usePhraseLibrary } from "@/hooks/usePhraseLibrary";
import { PHRASE_CATEGORIES } from "@/lib/mock/phrases";

export default function PhraseManager() {
  const { phrases, addPhrase, removePhrase } = usePhraseLibrary();
  const [category, setCategory] = useState(PHRASE_CATEGORIES[0]);
  const [tagsInput, setTagsInput] = useState("");
  const [text, setText] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [filterKeyword, setFilterKeyword] = useState("");

  const allTags = Array.from(new Set(phrases.flatMap((p) => p.tags))).sort();

  const filtered = phrases.filter((p) => {
    if (filterCategory !== "全部" && p.category !== filterCategory) return false;
    if (!filterKeyword) return true;
    const kw = filterKeyword.toLowerCase();
    return (
      p.text.toLowerCase().includes(kw) ||
      p.tags.some((t) => t.toLowerCase().includes(kw)) ||
      p.category.toLowerCase().includes(kw)
    );
  });

  function submit() {
    if (!text.trim()) return;
    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    addPhrase({ category, tags, text: text.trim() });
    setText("");
    setTagsInput("");
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-stone-400">
        後台可分類設定常用字句，供各護理表單以下拉選單或關鍵字查詢引用，不用每次手key
        （系統開發總則第10條；分類為單一歸屬，標籤🏷️可複選、更彈性）。
      </p>

      <div className="rounded-xl border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">＋ 新增片語</div>
        <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-stone-200 px-2 py-2 text-sm"
          >
            {PHRASE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="標籤🏷️（逗號分隔，如：母乳,傷口）"
            className="rounded-lg border border-stone-200 px-2 py-2 text-sm"
          />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="片語內容"
          className="mt-2 w-full rounded-lg border border-stone-200 p-2 text-sm"
        />
        <div className="mt-2 flex justify-end">
          <button onClick={submit} className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-medium text-white hover:bg-rose-600">
            新增片語
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
        >
          <option>全部</option>
          {PHRASE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          placeholder="關鍵字查詢（內容/標籤/分類）"
          className="w-56 rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
        />
        <span className="ml-auto text-xs text-stone-400">共 {filtered.length} 則</span>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-stone-400">🏷️ 現有標籤：</span>
          {allTags.map((t) => (
            <button key={t} onClick={() => setFilterKeyword(t)}>
              <Badge color="purple">{t}</Badge>
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((p) => (
          <li key={p.id} className="rounded-xl border border-stone-200 p-3">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Badge color="amber">{p.category}</Badge>
              {p.tags.map((t) => (
                <Badge key={t} color="purple">
                  🏷️ {t}
                </Badge>
              ))}
              <button onClick={() => removePhrase(p.id)} className="ml-auto text-xs text-rose-500 underline">
                刪除
              </button>
            </div>
            <p className="text-sm text-stone-700">{p.text}</p>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-400">
            查無片語
          </li>
        )}
      </ul>
    </div>
  );
}
