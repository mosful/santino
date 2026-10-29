"use client";

import { useState } from "react";
import { useDomainStore } from "@/lib/demo/domainStore";
import { caseActions } from "@/lib/demo/domainStore";
import { hospitalOptions, OTHER_HOSPITAL } from "@/lib/domain/options";
import { buttonStyles } from "@/components/ui/buttonStyles";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";

/**
 * 生產醫院欄位。
 *
 * 選單＝內建清單＋院方自行新增的（`data.hospitals`）。選到「其他」時就地開一個輸入框，
 * 打完按「加入清單」當場併進主檔，之後所有生產醫院下拉都看得到（客戶 2026-10-29）；
 * 要改名或移除走「後台管理 → 基礎主檔設定」。
 *
 * ⚠️ 「其他」本身不是一家醫院，是入口——存進案件的一定是實際院所名，
 * 否則價目表的院內／院外級距（options.ts 的 hospitalTier）會全部落到院外。
 */
export default function HospitalSelect({ label = "生產醫院", required = false, value, onChange }: { label?: string; required?: boolean; value: string; onChange: (value: string) => void }) {
  const { data } = useDomainStore();
  const options = hospitalOptions(data.hospitals);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  // 值不在清單裡（例如舊資料）時一併列出來，才不會看起來像被清空。
  const list = value && !options.includes(value) ? [value, ...options] : options;

  function add() {
    try {
      caseActions.saveHospital("", draft);
      onChange(draft.trim());
      setDraft("");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "新增失敗。");
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <label className="block space-y-2">
        <span>{label}{required && <em className="ml-0.5 not-italic font-semibold text-rose-600" aria-hidden="true">*</em>}</span>
        <select aria-label={label} className={input} value={value} onChange={(event) => { setError(""); onChange(event.target.value); }}>
          {list.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      {value === OTHER_HOSPITAL && (
        <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <label className="block space-y-2">
            <span className="text-xs text-stone-600">請輸入生產院所名稱，加入後所有生產醫院選單都會出現。</span>
            <input aria-label="新增生產醫院" className={input} value={draft} placeholder="例：台南市立醫院" onChange={(event) => setDraft(event.target.value)} />
          </label>
          <button type="button" className={buttonStyles({ size: "sm" })} disabled={!draft.trim()} onClick={add}>加入清單</button>
          {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
