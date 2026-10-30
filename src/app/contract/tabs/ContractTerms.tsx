"use client";

import { useState } from "react";
import { report, reportFail } from "@/lib/demo/lenient";
import { Toast, useToast } from "@/components/ui/Toast";
import LegacyCaseScope from "@/components/cases/LegacyCaseScope";
import { caseActions, useDomainStore } from "@/lib/demo/domainStore";
import { contractSettingActions } from "@/lib/domain/contractSettings";
import type { CaseRecord } from "@/lib/domain/types";

const ARTICLES = [
  "第一條 定義",
  "第二條 進住日期",
  "第三條 收費標準",
  "第四條 猶豫期（審閱期）",
  "第五條 退費規定",
];

export default function ContractTerms() { return <LegacyCaseScope>{(record) => <TermsPanel key={record.id} record={record} />}</LegacyCaseScope>; }
function TermsPanel({ record }: { record: CaseRecord }) {
  const { data } = useDomainStore(); const days = data.contractSettings.reviewDays;
  const [toast, toastProps] = useToast();
  function run(action: () => void) { try { action(); report(toast, "已更新共用合約資料。"); } catch (error) { reportFail(toast, error, "儲存失敗。"); } }
  const [selectedArticle, setSelectedArticle] = useState(ARTICLES[0]);
  return (
    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
      <ul className="space-y-1 text-xs">
        {ARTICLES.map((a) => (
          <li key={a}>
            <button
              type="button"
              onClick={() => setSelectedArticle(a)}
              className={`block w-full rounded px-2 py-1 text-left hover:bg-stone-100 ${selectedArticle === a ? "bg-rose-50 text-rose-600" : ""}`}
            >
              {a}
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-4 text-sm"><Toast {...toastProps} />
        <div className="rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
          目前檢視：<strong>{selectedArticle}</strong>
        </div>
        <div className="rounded border border-rose-200 bg-rose-50 p-3">
          <div className="mb-2 text-xs font-medium text-rose-700">猶豫期（審閱期）回推規則</div>
          <div className="flex items-center gap-2 text-xs">
            審閱期天數：
            <input
              type="number"
              value={days}
              onChange={(e) => run(() => contractSettingActions.reviewDays(Number(e.target.value)))}
              className="w-16 rounded border border-stone-200 px-2 py-1"
            />
            天（可調整）
          </div>
          <p className="mt-2 text-xs text-stone-500">
            若客戶拿走合約審閱後隔天就想簽約（未滿{days}天），系統可將「合約交付日」往前回推以滿足審閱天數，
            <strong>只能往前調整，不能無限延後或超過</strong>。
          </p>
        </div>

        <div className="rounded border border-stone-200 p-3">
          <div className="mb-2 text-xs font-medium text-stone-600">入住日期（另一個簽約後仍可修改欄位）</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="實際入住日" type="date" value={record.actualAdmission} onChange={(value) => run(() => caseActions.update(record.id, { actualAdmission: value }))} />
            <Field label="住房天數起算" value={record.actualAdmission || "尚未實際入住"} />
          </div>
          <p className="mt-2 text-xs text-stone-400">
            入住日確定變動時，系統需產生「新版」合約（同編號＋新日期戳記，舊版仍保留可查）。
          </p>
        </div>

        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
          已簽約的房型／天數／金額異動須使用合約變更單，保留原合約快照與簽名，不清空已簽紀錄。
        </div>

        <div className="rounded border border-stone-200 p-3">
          <div className="mb-2 text-xs font-medium text-stone-600">簽署區</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="mb-1 text-stone-500">甲方簽名</div>
              <div className="flex h-16 items-center justify-center rounded bg-stone-50 text-stone-300">
                {record.signed ? "本案已簽署，可於完整案件檢視原簽名" : "尚未簽署，請開啟完整案件流程"}
              </div>
            </div>
            <Field label="乙方" value="聖帝諾產後護理之家（展示）" />
            <Field label="簽約日期" value={record.signedDate || "尚未簽約"} />
          </div>
          <p className="mt-2 text-xs text-stone-400">簽署人一般為本人，媽媽身體不便時可由家屬代簽。</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, type = "text", onChange }: { label: string; placeholder?: string; value?: string; type?: string; onChange?: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-stone-500">{label}</label>
      <input aria-label={label} type={type} value={value ?? ""} readOnly={!onChange} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm" />
    </div>
  );
}
