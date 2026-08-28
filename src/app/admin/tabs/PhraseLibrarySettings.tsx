import PhraseManager from "@/components/phrases/PhraseManager";

export default function PhraseLibrarySettings() {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">
          常用語／片語庫設定（系統開發總則第10條，供各護理表單引用）
        </div>
        <PhraseManager />
      </div>
    </div>
  );
}
