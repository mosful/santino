"use client";

import { useState } from "react";
import Switch from "@/components/ui/Switch";
import PhraseManager from "@/components/phrases/PhraseManager";

export default function SystemSettings() {
  const [multiWindowLock, setMultiWindowLock] = useState(false);
  const [reboundDays, setReboundDays] = useState(3);

  return (
    <div className="space-y-5 text-sm">
      <div className="rounded border border-rose-200 bg-rose-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-medium text-rose-700">
            多視窗鎖房範圍開關（系統開發總則第9條）
          </div>
          <Switch checked={multiWindowLock} onChange={setMultiWindowLock} />
        </div>
        <p className="text-xs text-rose-600">
          {multiWindowLock
            ? "已開啟：多視窗僅限「同一房間內」可多開，不可同時操作不同房間的表單。"
            : "已關閉（預設）：多視窗不限房間，可同時開啟不同房間的表單／分頁，僅「簽名」步驟強制鎖定單一房間。"}
        </p>
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">退房後護理紀錄補登窗口</div>
        <div className="flex items-center gap-2 text-xs">
          退房後
          <input
            type="number"
            value={reboundDays}
            onChange={(e) => setReboundDays(Number(e.target.value))}
            className="w-16 rounded border border-slate-200 px-2 py-1"
          />
          天內開放回補資料
        </div>
        <p className="mt-1 text-xs text-amber-600">
          ⚠ 客戶尚未定案此天數（阿長提議「3天」但本人加了問號），此為可調整參數示意，正式上線前需與客戶再確認。
        </p>
        <p className="mt-1 text-xs text-slate-400">
          修改紀錄需正確歸屬實際登入員工，不可用共用帳號代填。
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">
          常用語／片語庫設定（系統開發總則第10條，供各護理表單引用）
        </div>
        <PhraseManager />
      </div>
    </div>
  );
}
