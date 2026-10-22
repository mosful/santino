"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { casePriceBreakdown, gifts } from "@/lib/domain/rules";
import { CORPORATE_COMPANIES, COMMON_STAY_DAYS, HOSPITALS } from "@/lib/domain/options";
import type { CaseRecord } from "@/lib/domain/types";

/**
 * 套餐快速試算。
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
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [roomType, setRoomType] = useState<CaseRecord["roomType"]>("精緻"); const [days, setDays] = useState(24);
  const [hospital, setHospital] = useState<string>(HOSPITALS[0]); const [priceClass, setPriceClass] = useState("一般"); const [corporateCompany, setCorporateCompany] = useState("");
  const quote = { roomType, days, hospital, priceClass, addOns: [] as string[] };
  const detail = casePriceBreakdown(quote);
  return <CollapsibleSection id="case-quote" title="套餐快速試算" summary={`${roomType} ${days} 天`} bodyClassName="space-y-5"><p className="text-sm text-stone-500">姓名與電話可先留白；確認方案後可帶入新預約，正式價格仍以院方核定為準。</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Field label="媽媽姓名（選填）" value={name} onChange={setName} /><Field label="聯絡電話（選填）" value={phone} onChange={setPhone} /><Field label="房型" value={roomType} options={["精緻", "VIP", "VILLA"]} onChange={(value) => setRoomType(value as CaseRecord["roomType"])} /><div className="space-y-2 text-sm"><span>天數</span><input aria-label="試算天數" type="number" min={1} max={365} className={input} value={days} onChange={(event) => setDays(Math.max(1, Number(event.target.value) || 1))} /><div className="flex flex-wrap gap-2">{COMMON_STAY_DAYS.map((value) => <button type="button" key={value} aria-pressed={days === value} className={buttonStyles({ size: "sm", selected: days === value })} onClick={() => setDays(value)}>{value} 天</button>)}</div></div><Field label="生產院所分級" value={hospital} options={[...HOSPITALS]} onChange={setHospital} /><div className="space-y-3"><Field label="價格類別" value={priceClass} options={["一般", "特約企業", "員工價"]} onChange={setPriceClass} />{priceClass === "特約企業" && <Field label="特約企業" value={corporateCompany} options={["", ...corporateCompanies]} onChange={setCorporateCompany} />}</div></div><div className="rounded-xl bg-stone-50 p-4 text-sm"><h3 className="font-semibold">試算明細</h3><dl className="mt-3 grid gap-2 sm:grid-cols-2"><div className="flex justify-between gap-3"><dt>房型日價</dt><dd>{money(detail.baseDaily)}</dd></div><div className="flex justify-between gap-3"><dt>院所日加價</dt><dd>{money(detail.hospitalDaily)}</dd></div><div className="flex justify-between gap-3"><dt>價格係數</dt><dd>{detail.multiplier === 1 ? "一般價" : `${detail.multiplier * 100}%`}</dd></div><div className="flex justify-between gap-3"><dt>付費／贈送天數</dt><dd>{detail.paidDays}／{detail.giftedDays} 天</dd></div></dl><p className="mt-4 text-right text-lg font-semibold">預估總額 {money(detail.total)}</p><p className="mt-2 text-xs text-stone-500">自動贈品：{gifts(days).join("、") || "未達 21 天門檻"}</p></div><div className="flex flex-wrap justify-end gap-2"><button type="button" className={button} onClick={() => window.print()}>列印試算單</button><button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => onUse(name, phone, { roomType, days, hospital, priceClass, corporateCompany })}>帶入新預約</button></div></CollapsibleSection>;
}
