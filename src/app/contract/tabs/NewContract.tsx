"use client";

import { useRef, useState } from "react";
import LegacyCaseScope from "@/components/cases/LegacyCaseScope";
import { caseActions } from "@/lib/demo/domainStore";
import type { CaseRecord } from "@/lib/domain/types";
import { HOSPITALS } from "@/lib/domain/options";
import PrototypeFormActions from "@/components/ui/PrototypeFormActions";

function Field({ label, placeholder, value, readOnly }: { label: string; placeholder?: string; value?: string | number; readOnly?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-stone-500">{label}</label>
      <input aria-label={label} name={label} defaultValue={value} readOnly={readOnly} placeholder={placeholder} className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm" />
    </div>
  );
}

export default function NewContract() { return <LegacyCaseScope filter="draft">{(record) => <NewContractForm key={record.id} record={record} />}</LegacyCaseScope>; }
function NewContractForm({ record }: { record: CaseRecord }) {
  const form = useRef<HTMLFormElement>(null);
  const [upgradeVip, setUpgradeVip] = useState((record.addOns ?? []).includes("升等房間"));
  const [mealFollowsUpgrade, setMealFollowsUpgrade] = useState((record.addOns ?? []).includes("餐點一併升等"));
  function save() {
    const fields = new FormData(form.current!); const rawType = String(fields.get("房型") ?? "").replace("房", "");
    if (!["精緻", "VIP", "VILLA"].includes(rawType)) throw new Error("房型請填精緻、VIP 或 VILLA。");
    const addOns = [fields.has("hotpot") ? "紅蟳火鍋" : "", fields.has("gift") ? "蒙娜麗莎之吻（當天下訂且需訂位）" : "", upgradeVip ? "升等房間" : "", upgradeVip && mealFollowsUpgrade ? "餐點一併升等" : ""].filter(Boolean);
    const hospital = String(fields.get("hospital")); const priceClass = String(fields.get("priceClass"));
    caseActions.update(record.id, { roomType: rawType as CaseRecord["roomType"], days: Number(fields.get("住房天數")), addOns, tasting: fields.has("tasting"), bossGift: String(fields.get("bossGift") ?? ""), hospital, priceClass: priceClass === "一般價" ? "一般" : priceClass === "員工價" ? "員工價" : "特約企業" });
    caseActions.save(record.id);
  }

  return (
    <form ref={form} onSubmit={(event) => event.preventDefault()} className="space-y-5 text-sm">
      <div className="grid grid-cols-3 gap-3">
        <Field label="房型" value={record.roomType} />
        <Field label="住房天數" value={record.days} />
        <Field label="示範房型日價（唯讀）" value={{ 精緻: 7500, VIP: 8500, VILLA: 9500 }[record.roomType]} readOnly />
      </div>

      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">
          自動搭配贈品／課程（依天數/房型自動列出，仍可增減）
        </div>
        <ul className="space-y-1 text-xs text-stone-600">
          <li>✓ 21~29天 → 贈送「胸腺疏通」乙堂</li>
          <li className="text-stone-300">30天以上 → 贈送「維納斯身體雕塑」乙次（本次天數未達標）</li>
        </ul>
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 p-3">
        <div className="mb-2 text-xs font-medium text-amber-700">
          需個別選擇項目（不隨套餐自動帶入）
        </div>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="hotpot" defaultChecked={record.addOns?.includes("紅蟳火鍋")} /> 升級紅蟳火鍋
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="gift" defaultChecked={record.addOns?.some((item) => item.startsWith("蒙娜麗莎"))} /> 蒙娜麗莎之吻（需訂位，限「當天下定」才贈送）
            <input placeholder="訂位時段" className="ml-2 rounded border border-stone-200 px-2 py-0.5" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="tasting" defaultChecked={record.tasting} /> 試吃（先收$350，若當次下訂自動折抵尾款）
          </label>
          <div className="flex items-center gap-2">
            <input type="checkbox" /> 老闆加送：
            <input name="bossGift" defaultValue={record.bossGift} placeholder="自訂品項名稱" className="rounded border border-stone-200 px-2 py-0.5" />
          </div>
        </div>
      </div>

      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">升VIP房</div>
        <label className="mb-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={upgradeVip} onChange={(e) => setUpgradeVip(e.target.checked)} />
          升等VIP房（如老闆招待）
        </label>
        {upgradeVip && (
          <label className="flex items-center gap-2 text-xs text-stone-500">
            <input
              type="checkbox"
              checked={mealFollowsUpgrade}
              onChange={(e) => setMealFollowsUpgrade(e.target.checked)}
            />
            餐飲等級是否跟著升等（可分開設定；房型實際入住與帳務金額可分開記錄）
          </label>
        )}
      </div>

      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">定價分級</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-stone-500">生產院所分級</label>
            <select name="hospital" defaultValue={HOSPITALS.find((item) => item === record.hospital) ?? HOSPITALS[0]} className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm">
              {HOSPITALS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">員工價／特約企業價</label>
            <select name="priceClass" defaultValue={record.priceClass === "員工價" ? "員工價" : record.priceClass === "一般" ? "一般價" : "台積電"} className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm">
              <option>一般價</option>
              <option>員工價</option>
              <option>台積電</option>
              <option>台灣康寧</option>
              <option>華邦電子</option>
              <option>科林研發</option>
              <option className="text-stone-400">＋後台可新增其他特約企業</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-xs text-stone-400">
        ✗ 已拿掉「合約檔案上傳」功能（客戶明確表示用不到）
      </p>

      <PrototypeFormActions accent="rose" submitLabel="儲存本案合約草稿" onDraft={save} onSubmit={save} />
    </form>
  );
}
