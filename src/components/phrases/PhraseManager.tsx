"use client";

import { useState } from "react";
import { FormSection, WorkArea } from "@/components/ui/Workspace";
import Badge from "@/components/ui/Badge";
import { usePhraseLibrary } from "@/hooks/usePhraseLibrary";
import { PHRASE_CATEGORIES } from "@/lib/mock/phrases";
import { canEditAdminSetting } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/roleStore";
import { buttonStyles } from "@/components/ui/buttonStyles";

export default function PhraseManager() {
  const { phrases, addPhrase, removePhrase } = usePhraseLibrary();
  const canEdit = canEditAdminSetting(useCurrentRole(), "operations");
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
      .map((tag) => tag.trim())
      .filter(Boolean);
    addPhrase({ category, tags, text: text.trim() });
    setText("");
    setTagsInput("");
  }

  return (
    <div className="space-y-5 text-sm">
      <p className="text-sm text-stone-600">依分類與標籤管理常用片語，護理表單可直接搜尋引用。</p>
      <WorkArea aside={<FormSection title="新增片語" description="分類為單一歸屬；標籤可複選，方便從不同情境查找。">
        <label className="block space-y-2">分類<select aria-label="新增片語分類" value={category} onChange={(e) => setCategory(e.target.value)} disabled={!canEdit} className="w-full rounded-lg border border-stone-300">{PHRASE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="block space-y-2">標籤<input aria-label="片語標籤" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} disabled={!canEdit} placeholder="逗號分隔，如：母乳,傷口" className="w-full rounded-lg border border-stone-300" /></label>
        <label className="block space-y-2">片語內容<textarea aria-label="片語內容" value={text} onChange={(e) => setText(e.target.value)} disabled={!canEdit} placeholder="輸入可重複引用的完整內容" className="w-full rounded-lg border border-stone-300" /></label>
        <div className="form-actions"><button type="button" onClick={submit} disabled={!canEdit} className={buttonStyles({ variant: "primary" })}>新增片語</button></div>
      </FormSection>}>
        <FormSection title="片語清單">
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="片語分類篩選" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border border-stone-300"><option>全部</option>{PHRASE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input aria-label="片語關鍵字" value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} placeholder="關鍵字查詢（內容／標籤／分類）" className="min-w-0 flex-1 rounded-lg border border-stone-300" />
            <span className="text-xs text-stone-500">共 {filtered.length} 則</span>
          </div>
          {allTags.length > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-stone-500">標籤</span>{allTags.map((t) => <button type="button" key={t} className={buttonStyles({ size: "sm", selected: filterKeyword === t })} onClick={() => setFilterKeyword(t)}>{t}</button>)}</div>}
          <ul className="divide-y divide-stone-100">
            {filtered.map((p) => <li key={p.id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-2 flex flex-wrap items-center gap-2"><Badge color="blue">{p.category}</Badge>{p.tags.map((t) => <span key={t} className="text-xs text-stone-500">#{t}</span>)}<button type="button" onClick={() => removePhrase(p.id)} disabled={!canEdit} className="ml-auto text-xs text-rose-700 underline underline-offset-4 disabled:opacity-50">刪除</button></div>
              <p className="leading-7 text-stone-700">{p.text}</p>
            </li>)}
            {filtered.length === 0 && <li className="rounded-lg bg-stone-50 p-6 text-center text-sm text-stone-500">查無片語，可調整分類或關鍵字。</li>}
          </ul>
        </FormSection>
      </WorkArea>
    </div>
  );
}
