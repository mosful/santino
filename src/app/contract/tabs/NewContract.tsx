"use client";

import { useState } from "react";

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input placeholder={placeholder} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
    </div>
  );
}

export default function NewContract() {
  const [upgradeVip, setUpgradeVip] = useState(false);
  const [mealFollowsUpgrade, setMealFollowsUpgrade] = useState(true);

  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-3 gap-3">
        <Field label="房型" placeholder="精緻房" />
        <Field label="住房天數" placeholder="21" />
        <Field label="單價（自動帶出，可手動調整）" placeholder="8000" />
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">
          自動搭配贈品／課程（依天數/房型自動列出，仍可增減）
        </div>
        <ul className="space-y-1 text-xs text-slate-600">
          <li>✓ 21~29天 → 贈送「胸腺疏通」乙堂</li>
          <li className="text-slate-300">30天以上 → 贈送「維納斯身體雕塑」乙次（本次天數未達標）</li>
        </ul>
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 p-3">
        <div className="mb-2 text-xs font-medium text-amber-700">
          需個別選擇項目（不隨套餐自動帶入）
        </div>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" /> 升級紅蟳火鍋
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" /> 蒙娜麗莎之吻（需訂位，限「當天下定」才贈送）
            <input placeholder="訂位時段" className="ml-2 rounded border border-slate-200 px-2 py-0.5" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" /> 試吃（先收$350，若當次下訂自動折抵尾款）
          </label>
          <div className="flex items-center gap-2">
            <input type="checkbox" /> 老闆加送：
            <input placeholder="自訂品項名稱" className="rounded border border-slate-200 px-2 py-0.5" />
          </div>
        </div>
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">升VIP房</div>
        <label className="mb-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={upgradeVip} onChange={(e) => setUpgradeVip(e.target.checked)} />
          升等VIP房（如老闆招待）
        </label>
        {upgradeVip && (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={mealFollowsUpgrade}
              onChange={(e) => setMealFollowsUpgrade(e.target.checked)}
            />
            餐飲等級是否跟著升等（可分開設定；房型實際入住與帳務金額可分開記錄）
          </label>
        )}
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">定價分級</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">生產院所分級</label>
            <select className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm">
              <option>園內生產院所（最優惠）</option>
              <option>成大/奇美（次之）</option>
              <option>其他院所</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">員工價／特約企業價</label>
            <select className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm">
              <option>一般價</option>
              <option>員工價</option>
              <option>台積電</option>
              <option>台灣康寧</option>
              <option>華邦電子</option>
              <option>科林研發</option>
              <option className="text-slate-400">＋後台可新增其他特約企業</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        ✗ 已拿掉「合約檔案上傳」功能（客戶明確表示用不到）
      </p>

      <div className="flex justify-end gap-2">
        <button className="rounded bg-slate-100 px-3 py-1.5 text-xs">暫存</button>
        <button className="rounded bg-rose-500 px-3 py-1.5 text-xs text-white">建立合約</button>
      </div>
    </div>
  );
}
