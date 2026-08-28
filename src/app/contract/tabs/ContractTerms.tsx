"use client";

import { useState } from "react";

const ARTICLES = [
  "第一條 定義",
  "第二條 進住日期",
  "第三條 收費標準",
  "第四條 猶豫期（審閱期）",
  "第五條 退費規定",
];

export default function ContractTerms() {
  const [days, setDays] = useState(5);
  return (
    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
      <ul className="space-y-1 text-xs">
        {ARTICLES.map((a) => (
          <li key={a}>
            <a href="#" className="block rounded px-2 py-1 hover:bg-slate-100">
              {a}
            </a>
          </li>
        ))}
      </ul>
      <div className="space-y-4 text-sm">
        <div className="rounded border border-rose-200 bg-rose-50 p-3">
          <div className="mb-2 text-xs font-medium text-rose-700">猶豫期（審閱期）回推規則</div>
          <div className="flex items-center gap-2 text-xs">
            審閱期天數：
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-16 rounded border border-slate-200 px-2 py-1"
            />
            天（可調整）
          </div>
          <p className="mt-2 text-xs text-slate-500">
            若客戶拿走合約審閱後隔天就想簽約（未滿{days}天），系統可將「合約交付日」往前回推以滿足審閱天數，
            <strong>只能往前調整，不能無限延後或超過</strong>。
          </p>
        </div>

        <div className="rounded border border-slate-200 p-3">
          <div className="mb-2 text-xs font-medium text-slate-600">入住日期（另一個簽約後仍可修改欄位）</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="實際入住日" />
            <Field label="住房天數起算" placeholder="以實際入住日起算，非簽約當天" />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            入住日確定變動時，系統需產生「新版」合約（同編號＋新日期戳記，舊版仍保留可查）。
          </p>
        </div>

        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
          ⚠ 已簽約，調整訂房需重新簽名——房型/天數/金額被修改時，系統須自動退回「待重新簽名」並清空原簽名圖檔。
        </div>

        <div className="rounded border border-slate-200 p-3">
          <div className="mb-2 text-xs font-medium text-slate-600">簽署區</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="mb-1 text-slate-500">甲方簽名</div>
              <div className="flex h-16 items-center justify-center rounded bg-slate-50 text-slate-300">
                簽名板（可重複帶入其他表單）
              </div>
            </div>
            <Field label="乙方" placeholder="聖帝諾產後護理之家" />
            <Field label="簽約日期" placeholder="西元/民國並列" />
          </div>
          <p className="mt-2 text-xs text-slate-400">簽署人一般為本人，媽媽身體不便時可由家屬代簽。</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input placeholder={placeholder} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
    </div>
  );
}
