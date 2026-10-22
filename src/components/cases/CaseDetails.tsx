"use client";

import { useState } from "react";
import { caseActions, useDomainStore } from "@/lib/demo/domainStore";
import { freeDays, roomDailyRate } from "@/lib/domain/rules";
import {
  DEFAULT_CHECKOUT_ITEMS,
  INSPECTION_ITEMS,
  INSPECTION_SECTIONS,
  RETURN_CHARGE_FIELDS,
  missingItemTotal,
  pendingInspection,
  returnChargeTotal,
  returnItemRows,
  returnTotal,
} from "@/lib/domain/checkout";
import { dailyCharges } from "@/lib/domain/rules";
import { useCurrentRole } from "@/lib/roleStore";
import { saveCarePhoto } from "@/lib/care/media";
import type { CaseRecord } from "@/lib/domain/types";
import LocalMedia from "../babycam/LocalMedia";
import { buttonStyles } from "@/components/ui/buttonStyles";
import CollapsibleSection from "@/components/ui/CollapsibleSection";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
// 按鈕樣式一律取自 components/ui/Button，不在此另開複本（見該檔開頭說明）。
const button = buttonStyles();

export function DailyLedger({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const role = useCurrentRole();
  const [entryId, setEntryId] = useState(""); const [amount, setAmount] = useState(""); const [reason, setReason] = useState(""); const [message, setMessage] = useState("");
  const rows = dailyCharges(record);
  return <CollapsibleSection id="case-daily-ledger" title="逐日房租與自費明細" summary={`${rows.length} 列`} bodyClassName="space-y-4"><p className="text-sm text-stone-600">原合約金額按原付費日分攤，最後付費日調整尾差；贈送日為 0。變更與自費另列，不更動原合約快照。逐日可改為贈送日，系統會加一筆同額折讓，原房費保留在明細中。</p><div className="max-h-96 overflow-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr><th className="p-2">日期</th><th className="p-2">項目</th><th className="p-2 text-right">金額</th>{editable && <th className="p-2">計費方式</th>}</tr></thead><tbody>{rows.map((row, index) => { const gifted = record.ledger.some((entry) => entry.giftDate === row.date); const chargeable = row.amount > 0 && row.label.includes("原合約"); return <tr key={index} className="border-t border-stone-200"><td className="p-2">{row.date}</td><td className="p-2">{row.label}</td><td className="p-2 text-right tabular-nums">{row.amount.toLocaleString("zh-TW")}</td>{editable && <td className="p-2">{(chargeable || gifted) && !row.label.includes("折讓") && <button type="button" className={buttonStyles({ size: "sm", selected: gifted })} onClick={() => { try { caseActions.toggleGiftDay(record.id, row.date); setMessage(gifted ? `已恢復 ${row.date} 的房費。` : `${row.date} 已改為贈送日。`); } catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗。"); } }}>{gifted ? "取消贈送" : "設為贈送"}</button>}</td>}</tr>; })}</tbody></table></div>{editable && ["護理長 婉真", "管理者"].includes(role) && <details><summary className="min-h-12 cursor-pointer text-sm">主管帳務例外調整</summary><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">原收費項目<select aria-label="例外調整項目" className={input} value={entryId} onChange={(event) => { setEntryId(event.target.value); setAmount(""); }}><option value="">請選擇自費／變更項目</option>{record.ledger.filter((entry) => !entry.adjustsId).map((entry) => <option value={entry.id} key={entry.id}>{entry.date}｜{entry.label}</option>)}</select></label><label className="text-sm">修正後金額<input aria-label="例外修正後金額" type="number" className={input} value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label className="sm:col-span-2 text-sm">急診／例外原因<input aria-label="帳務例外原因" className={input} value={reason} onChange={(event) => setReason(event.target.value)} /></label><button type="button" className={button} onClick={() => { try { if (!amount.trim()) throw new Error("請填修正後金額。"); caseActions.adjustCharge(record.id, entryId, Number(amount), reason); setMessage("已加列差額、保留原項目與主管授權紀錄。"); } catch (error) { setMessage(error instanceof Error ? error.message : "調整失敗。"); } }}>授權並加列調整</button></div></details>}{message && <p role="status" className="text-sm">{message}</p>}</CollapsibleSection>;
}

export function AdmissionMeal({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const [people, setPeople] = useState(record.meal?.people ?? 1); const [content, setContent] = useState(record.meal?.content ?? "一般餐"); const [message, setMessage] = useState("");
  return <section className="sm:col-span-2 space-y-3"><h3 className="font-medium">入住當天餐飲</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">餐飲人數<input aria-label="餐飲人數" type="number" min={1} max={10} disabled={!editable} className={input} value={people} onChange={(event) => setPeople(Number(event.target.value))} /></label><label className="text-sm">餐飲內容<input aria-label="餐飲內容" disabled={!editable} className={input} value={content} onChange={(event) => setContent(event.target.value)} /></label></div><button type="button" disabled={!editable} className={button} onClick={() => { try { caseActions.meal(record.id, people, content); setMessage("已保存入住當天餐飲。"); } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); } }}>儲存入住當天餐飲</button><p className="text-xs text-stone-600">以展示控制台日期判定入住當天，其他日期依變更流程處理。</p>{message && <p role="status" className="text-sm">{message}</p>}</section>;
}

export function ReturnPhotos({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const [email, setEmail] = useState(record.returnEmail ?? "demo@example.test"); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  return <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"><h2 className="font-semibold">返家照片留存與寄送示意</h2><input aria-label="返家照片" type="file" accept="image/*" disabled={!editable || busy} className={input} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); try { caseActions.returnPhoto(record.id, await saveCarePhoto(file)); setMessage("照片已留存在本機瀏覽器。"); } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); } finally { setBusy(false); event.target.value = ""; } }} /><div className="grid gap-3 sm:grid-cols-3">{record.returnPhotos?.map((id) => <LocalMedia key={id} id={id} alt="匿名返家照片" className="aspect-video w-full rounded-lg object-cover" />)}</div><label className="block space-y-2 text-sm">展示收件 Email<input aria-label="展示收件 Email" className={input} disabled={!editable} value={email} onChange={(event) => setEmail(event.target.value)} /></label><button type="button" className={button} disabled={!editable} onClick={() => { try { caseActions.simulateReturnMail(record.id, email); setMessage("寄送示意已記錄，未寄出郵件。"); } catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗。"); } }}>模擬寄送返家照片</button><p className="text-sm">寄送示意紀錄 {record.returnMailLog?.length ?? 0} 次；不連線郵件服務。</p>{message && <p role="status" className="text-sm">{message}</p>}</section>;
}

/**
 * 返家檢查表（手冊第 45 頁 S-F-012）：臥室 19 項＋浴室 10 項，逐項正常／異常。
 *
 * ⚠️ 異常一定要寫原因——這張表的用途就是退房當下講清楚哪裡壞了、誰要賠；
 * 原本 DEMO 的 6 個籠統勾選現場對不起來，已淘汰。
 */
export function ReturnInspection({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const pending = pendingInspection(record);
  const done = INSPECTION_ITEMS.length - pending;
  function run(action: () => void, success = "") {
    try { action(); setMessage(success); } catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗。"); }
  }
  const reasonOf = (item: string) => reasons[item] ?? record.roomInspection?.[item]?.reason ?? "";
  return <CollapsibleSection id="case-return-inspection" title="返家檢查表" summary={`${done}／${INSPECTION_ITEMS.length} 項`} bodyClassName="space-y-4">
    <p className="text-sm text-stone-600">退房當天逐項點交；標「異常」必須填原因，完成時會把異常項目寫進案件歷程。{record.checkoutCompletedAt ? "本表已完成。" : ""}</p>
    {editable && <div className="flex flex-wrap gap-2">
      <button type="button" className={button} onClick={() => run(() => caseActions.inspectAllNormal(record.id), "尚未檢查的項目已標記為正常。")}>未檢查的一次標正常</button>
      <button type="button" className={button} onClick={() => window.print()}>列印返家檢查表</button>
    </div>}
    {INSPECTION_SECTIONS.map((section) => <section key={section.label} className="space-y-2">
      <h3 className="font-medium">{section.label}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-stone-200"><th className="p-2">項目</th><th className="p-2">狀態</th><th className="p-2">異常原因</th></tr></thead>
          <tbody>{section.items.map((item) => {
            const current = record.roomInspection?.[item];
            return <tr key={item} className="border-b border-stone-100">
              <td className="p-2">{item}</td>
              <td className="p-2"><div className="flex gap-2">{(["正常", "異常"] as const).map((status) => <button type="button" key={status} disabled={!editable} aria-pressed={current?.status === status} className={buttonStyles({ size: "sm", selected: current?.status === status })} onClick={() => run(() => caseActions.inspect(record.id, item, status, reasonOf(item)))}>{status}</button>)}</div></td>
              <td className="p-2"><input aria-label={`${item} 異常原因`} disabled={!editable} className={input} value={reasonOf(item)} onChange={(event) => setReasons((items) => ({ ...items, [item]: event.target.value }))} placeholder={current?.status === "異常" ? "必填" : "異常時填寫"} /></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </section>)}
    <label className="block space-y-2 text-sm">其他說明<textarea aria-label="返家檢查其他說明" disabled={!editable} className={input} value={record.checkoutNote} onChange={(event) => caseActions.update(record.id, { checkoutNote: event.target.value })} placeholder="例如：遙控器遺失、需扣押金" /></label>
    {editable && <div className="flex flex-wrap gap-2">
      <button type="button" className={button} onClick={() => run(() => caseActions.completeCheckout(record.id), "返家檢查表已完成。")}>完成返家檢查表</button>
      {record.checkoutCompletedAt && <button type="button" className={button} onClick={() => run(() => caseActions.checkoutProgress(record.id, false), "返家檢查表已重新開啟。")}>重新開啟檢查</button>}
    </div>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </CollapsibleSection>;
}

/**
 * 返家指導單（手冊第 38 頁）：歸還品項帶單價，未歸還要收錢；
 * 另有應付款項 A 黃疸照光／B 托嬰費用／C 中醫部費用／D 美髮部費用／E 其他費用。
 * 合計用「寫入帳務」併進案件應收，不另外算一套帳。
 */
export function ReturnGuide({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const { data } = useDomainStore();
  const items = data.checkoutItems ?? DEFAULT_CHECKOUT_ITEMS;
  const [message, setMessage] = useState("");
  const rows = returnItemRows(record, items);
  const charges = record.returnCharges ?? { jaundice: 0, childcare: 0, chinese: 0, hair: 0, other: 0, note: "" };
  const total = returnTotal(record, items);
  function run(action: () => void, success = "") {
    try { action(); setMessage(success); } catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗。"); }
  }
  return <CollapsibleSection id="case-return-guide" title="返家指導單" summary={`應收 ${total.toLocaleString("zh-TW")} 元`} bodyClassName="space-y-4">
    <p className="text-sm text-stone-600">入住期間提供的品項請於退房歸還，未歸還依單價計價；單價於「後台管理 → 基礎主檔設定」維護。</p>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead><tr className="border-b border-stone-200"><th className="p-2">品項</th><th className="p-2 text-right">單價</th><th className="p-2">發出</th><th className="p-2">歸還</th><th className="p-2 text-right">未還</th><th className="p-2 text-right">應收</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.item.id} className="border-b border-stone-100">
          <td className="p-2">{row.item.name}（{row.item.unit}）</td>
          <td className="p-2 text-right tabular-nums">{row.item.price.toLocaleString("zh-TW")}</td>
          <td className="p-2"><input aria-label={`${row.item.name}發出數`} type="number" min={0} disabled={!editable} className={`${input} !w-20`} value={row.issued} onChange={(event) => { const issued = Number(event.target.value); run(() => caseActions.returnItem(record.id, row.item.id, issued, Math.min(row.returned, issued))); }} /></td>
          <td className="p-2"><input aria-label={`${row.item.name}歸還數`} type="number" min={0} max={row.issued} disabled={!editable} className={`${input} !w-20`} value={row.returned} onChange={(event) => run(() => caseActions.returnItem(record.id, row.item.id, row.issued, Number(event.target.value)))} /></td>
          <td className="p-2 text-right tabular-nums">{row.missing}</td>
          <td className="p-2 text-right tabular-nums">{row.amount.toLocaleString("zh-TW")}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {RETURN_CHARGE_FIELDS.map((field) => <label key={field.key} className="block space-y-2 text-sm">{field.label}
        <input aria-label={field.label} type="number" min={0} disabled={!editable} className={input} value={charges[field.key]} onChange={(event) => run(() => caseActions.returnCharge(record.id, { [field.key]: Number(event.target.value) }))} />
      </label>)}
      <label className="block space-y-2 text-sm sm:col-span-2 xl:col-span-3">應付款項說明
        <input aria-label="應付款項說明" disabled={!editable} className={input} value={charges.note} onChange={(event) => run(() => caseActions.returnCharge(record.id, { note: event.target.value }))} placeholder="例：中醫科 4,800（科中 7 天 600 元、科藥 7 帖 3,400 元）" />
      </label>
    </div>
    <div className="rounded-xl bg-stone-50 p-4 text-sm">
      <p>未歸還品項 {missingItemTotal(record, items).toLocaleString("zh-TW")} 元　＋　應付款項 A–E {returnChargeTotal(record).toLocaleString("zh-TW")} 元</p>
      <p className="mt-2 text-lg font-semibold">返家應收合計 {total.toLocaleString("zh-TW")} 元</p>
      {record.returnChargeEntryId && <p className="mt-1 text-xs text-stone-500">已寫入帳務，再按一次會更新同一筆金額。</p>}
    </div>
    {editable && <div className="flex flex-wrap gap-2">
      <button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => run(() => caseActions.chargeReturnTotal(record.id), "返家應收已寫入帳務。")}>應收寫入帳務</button>
      <button type="button" className={button} onClick={() => window.print()}>列印返家指導單</button>
    </div>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </CollapsibleSection>;
}

/**
 * 退費試算（手冊第 39 頁「早鳥活動－退費試算.xlsx」）。
 *
 * 提前返家時算要退多少：差異天數 × 每日房價，再加寶寶提前離院的一日退費。
 * 算完可直接寫入帳務成為一筆負數，不必另外開自費調整。
 */
export function RefundCalculator({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const contractDays = record.days;
  const gifted = freeDays(contractDays);
  const daily = roomDailyRate(record.roomType, record.hospital);
  const [stayedDays, setStayedDays] = useState(String(contractDays));
  const [babyDays, setBabyDays] = useState(String(contractDays));
  const [babyDailyRefund, setBabyDailyRefund] = useState("0");
  const [message, setMessage] = useState("");

  const diffDays = Math.max(0, contractDays - (Number(stayedDays) || 0));
  const babyDiff = Math.max(0, contractDays - (Number(babyDays) || 0));
  const refund = diffDays * daily + babyDiff * (Number(babyDailyRefund) || 0);

  return <CollapsibleSection id="case-refund" title="退費試算" summary={`可退 ${refund.toLocaleString("zh-TW")} 元`} bodyClassName="space-y-4">
    <p className="text-sm text-stone-600">提前返家時用；差異天數 × 每日房價，贈送天數不列入退費。實際退費仍以院方核定為準。</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div className="space-y-2 text-sm"><span className="text-stone-500">合約天數（含贈 {gifted} 天）</span><p className="text-lg font-semibold tabular-nums">{contractDays} 天</p></div>
      <div className="space-y-2 text-sm"><span className="text-stone-500">每日房價（{record.roomType}）</span><p className="text-lg font-semibold tabular-nums">{daily.toLocaleString("zh-TW")} 元</p></div>
      <label className="space-y-2 text-sm">媽媽實際入住天數<input aria-label="媽媽實際入住天數" type="number" min={0} max={contractDays} disabled={!editable} className={input} value={stayedDays} onChange={(event) => setStayedDays(event.target.value)} /></label>
      <label className="space-y-2 text-sm">寶寶實際入住天數<input aria-label="寶寶實際入住天數" type="number" min={0} max={contractDays} disabled={!editable} className={input} value={babyDays} onChange={(event) => setBabyDays(event.target.value)} /></label>
      <label className="space-y-2 text-sm">寶寶一日退費<input aria-label="寶寶一日退費" type="number" min={0} disabled={!editable} className={input} value={babyDailyRefund} onChange={(event) => setBabyDailyRefund(event.target.value)} /></label>
    </div>
    <div className="rounded-xl bg-stone-50 p-4 text-sm">
      <p>媽媽差異 {diffDays} 天 × {daily.toLocaleString("zh-TW")} 元　＋　寶寶差異 {babyDiff} 天 × {(Number(babyDailyRefund) || 0).toLocaleString("zh-TW")} 元</p>
      <p className="mt-2 text-lg font-semibold">退費總額 {refund.toLocaleString("zh-TW")} 元</p>
    </div>
    {editable && <div className="flex flex-wrap gap-2">
      <button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => {
        try {
          if (refund <= 0) throw new Error("退費金額為 0，不需寫入帳務。");
          caseActions.charge(record.id, `提前返家退費（媽媽 ${diffDays} 天、寶寶 ${babyDiff} 天）`, -refund, new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }), "", { category: "其他備品" });
          setMessage("退費已寫入帳務（負數）。");
        } catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗。"); }
      }}>退費寫入帳務</button>
      <button type="button" className={button} onClick={() => window.print()}>列印退費試算</button>
    </div>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </CollapsibleSection>;
}
