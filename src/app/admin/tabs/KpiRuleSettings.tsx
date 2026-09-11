"use client";

import { RotateCcw } from "lucide-react";
import {
  RED_RASH_GRADES,
  resetKpiSettings,
  toggleRedRashGrade,
  updateKpiRule,
  useKpiSettings,
} from "@/lib/kpiRuleStore";
import { useAccess } from "@/lib/roleStore";

export default function KpiRuleSettings() {
  const settings = useKpiSettings();
  const canEdit = useAccess("15") === "edit";

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-700">
        調整後會立即反映到「評鑑指標」頁面，供客戶確認統計公式、目標值及紅臀分級納入規則。
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="mb-3 font-medium text-stone-700">指標公式設定</h3>
        <div className="space-y-3">
          {settings.rules.map((rule) => (
            <div key={rule.id} className="grid gap-3 rounded-lg bg-stone-50 p-3 md:grid-cols-[1fr_1.2fr_1.2fr_100px] md:items-end">
              <label className="text-xs text-stone-500">指標名稱
                <input value={rule.label} onChange={(event) => updateKpiRule(rule.id, { label: event.target.value })} disabled={!canEdit} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100" />
              </label>
              <label className="text-xs text-stone-500">分子
                <input value={rule.numerator} onChange={(event) => updateKpiRule(rule.id, { numerator: event.target.value })} disabled={!canEdit} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100" />
              </label>
              <label className="text-xs text-stone-500">分母
                <input value={rule.denominator} onChange={(event) => updateKpiRule(rule.id, { denominator: event.target.value })} disabled={!canEdit} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100" />
              </label>
              <label className="text-xs text-stone-500">目標值％
                <input type="number" min={0} max={100} value={rule.target} onChange={(event) => updateKpiRule(rule.id, { target: Number(event.target.value) })} disabled={!canEdit} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100" />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="font-medium text-stone-700">紅臀分級納入規則</h3>
        <p className="mb-3 mt-1 text-xs text-stone-400">取消勾選的級別仍會顯示明細，但不納入紅臀發生率分子。</p>
        <div className="flex flex-wrap gap-2">
          {RED_RASH_GRADES.map((grade) => (
            <label key={grade} className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs">
              <input type="checkbox" checked={settings.includedRashGrades.includes(grade)} onChange={() => toggleRedRashGrade(grade)} disabled={!canEdit} />
              {grade}
            </label>
          ))}
        </div>
      </section>

      {canEdit && (
        <div className="flex justify-end">
          <button type="button" onClick={resetKpiSettings} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-4 py-2 text-xs text-stone-600">
            <RotateCcw className="h-3.5 w-3.5" />還原預設規則
          </button>
        </div>
      )}
    </div>
  );
}
