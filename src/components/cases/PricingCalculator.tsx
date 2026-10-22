"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { casePriceBreakdown, gifts } from "@/lib/domain/rules";
import { CORPORATE_COMPANIES, COMMON_STAY_DAYS, HOSPITALS } from "@/lib/domain/options";
import { DEMO_MOTHER_NAME, DEMO_PHONE } from "@/lib/demo/demoDefaults";
import type { CaseRecord } from "@/lib/domain/types";
import { quoteActions, useSavedQuotes } from "@/lib/quoteStore";

/**
 * 套餐速算。
 *
 * ⚠️ 原本是案件清單頁首的一顆展開按鈕；諮詢時最常用的東西藏在案件頁裡，
 * 客戶要求拉到左側選單「櫃台服務」的第一個位置（/quote）。
 * 試算完「帶入新預約」把條件丟回案件清單的新增預約，不要在這裡再開一份預約表單。
 */
const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
const button = buttonStyles();
const money = (value: number) => `NT$ ${value.toLocaleString("zh-TW")}`;
const corporateCompanies = [...CORPORATE_COMPANIES];
export type QuotePreset = Pick<CaseRecord, "roomType" | "days" | "hospital" | "priceClass" | "corporateCompany">;

function Field({ label, value, type = "text", options, onChange }: { label: string; value: string | number; type?: string; options?: string[]; onChange: (value: string) => void }) {
  return <label className="block space-y-2 text-sm"><span>{label}</span>{options ? <select aria-label={label} className={input} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input aria-label={label} className={input} type={type} value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}

export default function PricingCalculator({ onUse }: { onUse: (name: string, phone: string, preset: QuotePreset) => void }) {
  const [name, setName] = useState(DEMO_MOTHER_NAME); const [phone, setPhone] = useState(DEMO_PHONE);
  const [roomType, setRoomType] = useState<CaseRecord["roomType"]>("精緻"); const [days, setDays] = useState(24);
  const [hospital, setHospital] = useState<string>(HOSPITALS[0]); const [priceClass, setPriceClass] = useState("一般"); const [corporateCompany, setCorporateCompany] = useState("");
  const quote = { roomType, days, hospital, priceClass, addOns: [] as string[] };
  const detail = casePriceBreakdown(quote);
  const saved = useSavedQuotes();
  const [message, setMessage] = useState("");
  return <CollapsibleSection id="case-quote" title="套餐速算" summary={`${roomType} ${days} 天`} bodyClassName="space-y-5"><p className="text-sm text-stone-500">姓名與電話可先留白；確認方案後可帶入新預約，正式價格仍以院方核定為準。</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Field label="媽媽姓名（選填）" value={name} onChange={setName} /><Field label="聯絡電話（選填）" value={phone} onChange={setPhone} /><Field label="房型" value={roomType} options={["精緻", "VIP", "VILLA"]} onChange={(value) => setRoomType(value as CaseRecord["roomType"])} /><div className="space-y-2 text-sm"><span>天數</span><input aria-label="試算天數" type="number" min={1} max={365} className={input} value={days} onChange={(event) => setDays(Math.max(1, Number(event.target.value) || 1))} /><div className="flex flex-wrap gap-2">{COMMON_STAY_DAYS.map((value) => <button type="button" key={value} aria-pressed={days === value} className={buttonStyles({ size: "sm", selected: days === value })} onClick={() => setDays(value)}>{value} 天</button>)}</div></div><Field label="生產院所分級" value={hospital} options={[...HOSPITALS]} onChange={setHospital} /><div className="space-y-3"><Field label="價格類別" value={priceClass} options={["一般", "特約企業", "員工價"]} onChange={setPriceClass} />{priceClass === "特約企業" && <Field label="特約企業" value={corporateCompany} options={["", ...corporateCompanies]} onChange={setCorporateCompany} />}</div></div><div className="rounded-xl bg-stone-50 p-4 text-sm"><h3 className="font-semibold">試算明細</h3><dl className="mt-3 grid gap-2 sm:grid-cols-2"><div className="flex justify-between gap-3"><dt>房型日價</dt><dd>{money(detail.baseDaily)}</dd></div><div className="flex justify-between gap-3"><dt>院所日加價</dt><dd>{money(detail.hospitalDaily)}</dd></div><div className="flex justify-between gap-3"><dt>價格係數</dt><dd>{detail.multiplier === 1 ? "一般價" : `${detail.multiplier * 100}%`}</dd></div><div className="flex justify-between gap-3"><dt>付費／贈送天數</dt><dd>{detail.paidDays}／{detail.giftedDays} 天</dd></div></dl><p className="mt-4 text-right text-lg font-semibold">預估總額 {money(detail.total)}</p><p className="mt-2 text-xs text-stone-500">自動贈品：{gifts(days).join("、") || "未達 21 天門檻"}</p></div><div className="flex flex-wrap justify-end gap-2"><button type="button" className={button} onClick={() => { quoteActions.save({ name, phone, roomType, days, hospital, priceClass, corporateCompany, total: detail.total }); setMessage("已暫存這筆試算，可在下方取回。"); }}>暫存試算</button><button type="button" className={button} onClick={() => window.print()}>列印試算單</button><button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => onUse(name, phone, { roomType, days, hospital, priceClass, corporateCompany })}>帶入新預約</button></div>{message && <p role="status" className="text-sm text-stone-600">{message}</p>}
    {saved.length > 0 && <section className="space-y-2" data-no-print>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">已暫存的試算（{saved.length}）</h3>
        <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { quoteActions.clear(); setMessage("已清空暫存試算。"); }}>全部清除</button>
      </div>
      <p className="text-xs text-stone-500">同一位媽媽常要比兩三個方案；暫存只存在這台瀏覽器，最多保留 10 筆。</p>
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-stone-50 text-xs text-stone-500">
            <tr><th className="px-3 py-2.5 font-medium">暫存時間</th><th className="px-3 py-2.5 font-medium">媽媽／電話</th><th className="px-3 py-2.5 font-medium">方案</th><th className="px-3 py-2.5 font-medium text-right">試算金額</th><th className="px-3 py-2.5 font-medium">操作</th></tr>
          </thead>
          <tbody>{saved.map((item) => <tr key={item.id} className="border-t border-stone-100">
            <td className="whitespace-nowrap px-3 py-2.5 text-xs text-stone-500">{new Date(item.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}</td>
            <td className="px-3 py-2.5">{item.name || "未填"}<div className="text-xs text-stone-500">{item.phone || "未填"}</div></td>
            <td className="px-3 py-2.5 text-xs text-stone-600">{item.roomType} {item.days} 天<div>{item.hospital}｜{item.priceClass}{item.corporateCompany ? `（${item.corporateCompany}）` : ""}</div></td>
            <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{money(item.total)}</td>
            <td className="whitespace-nowrap px-3 py-2.5"><div className="flex flex-wrap gap-2">
              <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { setName(item.name); setPhone(item.phone); setRoomType(item.roomType as CaseRecord["roomType"]); setDays(item.days); setHospital(item.hospital); setPriceClass(item.priceClass); setCorporateCompany(item.corporateCompany); setMessage("已取回這筆試算。"); }}>取回</button>
              <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { quoteActions.remove(item.id); setMessage("已刪除這筆暫存。"); }}>刪除</button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>}
  </CollapsibleSection>;
}
