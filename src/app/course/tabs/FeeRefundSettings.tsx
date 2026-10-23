"use client";

import { useState } from "react";
import { FormSection, SummaryRow, WorkArea } from "@/components/ui/Workspace";
import Switch from "@/components/ui/Switch";

export default function FeeRefundSettings() {
  const [refundMode, setRefundMode] = useState<"full" | "partial" | "none">("partial");
  const [autoClose, setAutoClose] = useState(true);

  const [refundDays, setRefundDays] = useState(3);
  const [refundPercent, setRefundPercent] = useState(50);
  const [price, setPrice] = useState("");
  const [method, setMethod] = useState("現場收費");

  return (
    <WorkArea aside={<FormSection title="目前收費與退費規則"><SummaryRow label="收費金額" value={price || "依課程設定"} /><SummaryRow label="繳費方式" value={method} /><SummaryRow label="取消退費" value={refundMode === "full" ? "全額退費" : refundMode === "none" ? "不可退費" : `開課前 ${refundDays} 天內退 ${refundPercent}%`} /><SummaryRow label="額滿關閉報名" value={autoClose ? "開啟" : "關閉"} /></FormSection>}>
      <div className="work-surface p-5">
        <div className="mb-2 text-xs font-medium text-stone-600">收費金額設定</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="mb-1 block text-stone-500">預設收費金額</label>
            <input aria-label="預設收費金額" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="依課程個別設定" className="w-full rounded border border-stone-200 px-2 py-1.5" />
          </div>
          <div>
            <label className="mb-1 block text-stone-500">繳費方式</label>
            <select aria-label="繳費方式" value={method} onChange={(event) => setMethod(event.target.value)} className="w-full rounded border border-stone-200 px-2 py-1.5">
              <option>現場收費</option>
              <option>併入合約金額</option>
            </select>
          </div>
        </div>
      </div>

      <div className="work-surface p-5">
        <div className="mb-2 text-xs font-medium text-stone-600">取消／退費規則</div>
        <div className="flex flex-wrap gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input type="radio" checked={refundMode === "full"} onChange={() => setRefundMode("full")} /> 全額退費
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={refundMode === "partial"} onChange={() => setRefundMode("partial")} /> 開課前N天內部分退費
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={refundMode === "none"} onChange={() => setRefundMode("none")} /> 不可退費
          </label>
        </div>
        {refundMode === "partial" && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            開課前
            <input type="number" aria-label="開課前退費天數" value={refundDays} onChange={(event) => setRefundDays(Number(event.target.value))} className="w-14 rounded border border-stone-200 px-2 py-1" />
            天內取消，退費
            <input type="number" aria-label="退費百分比" value={refundPercent} onChange={(event) => setRefundPercent(Number(event.target.value))} className="w-14 rounded border border-stone-200 px-2 py-1" />
            %
          </div>
        )}
      </div>

      <div className="work-surface p-5">
        <Switch checked={autoClose} onChange={setAutoClose} label="已報名人數達上限後自動關閉報名入口（顯示「已滿」）" />
      </div>

      <div className="work-surface p-5">
        <div className="mb-2 text-xs font-medium text-stone-600">繳費狀態追蹤</div>
        <p className="text-xs text-stone-400">依報名清單顯示已繳費/未繳費狀態（示意，串接後由真實繳費紀錄帶入）。</p>
      </div>
    </WorkArea>
  );
}
