"use client";

import { useState } from "react";

export default function TerminationManagement() {
  const [mode, setMode] = useState<"ratio" | "fixed">("ratio");

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">
          退款計算規則設定（可設定，不寫死單一公式）
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={mode === "ratio"}
              onChange={() => setMode("ratio")}
            />
            依入住天數比例退費
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={mode === "fixed"}
              onChange={() => setMode("fixed")}
            />
            固定手續費
          </label>
          {mode === "fixed" && (
            <input placeholder="手續費金額" className="w-28 rounded border border-stone-200 px-2 py-1" />
          )}
        </div>
      </div>

      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">退約／作廢申請</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="mb-1 block text-stone-500">合約編號</label>
            <input placeholder="A115082801" className="w-full rounded border border-stone-200 px-2 py-1.5" />
          </div>
          <div>
            <label className="mb-1 block text-stone-500">作廢／退約原因</label>
            <select className="w-full rounded border border-stone-200 px-2 py-1.5">
              <option>客戶取消</option>
              <option>資料重複建立</option>
              <option>其他</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-stone-500">計算後退款金額</label>
            <input placeholder="系統依上方規則自動計算，可人工確認" className="w-full rounded border border-stone-200 px-2 py-1.5" />
          </div>
        </div>
        <p className="mt-2 text-xs text-stone-400">作廢需填寫原因並保留歷程，供稽核查詢。</p>
        <div className="mt-2 flex justify-end gap-2">
          <button className="rounded bg-stone-100 px-3 py-1.5 text-xs">暫存</button>
          <button className="rounded bg-rose-500 px-3 py-1.5 text-xs text-white">送出申請</button>
        </div>
      </div>
    </div>
  );
}
