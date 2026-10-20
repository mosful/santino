"use client";

import { useState } from "react";
import { babycamActions } from "@/lib/babycam/actions";
import type { DemoDomain } from "@/lib/domain/types";
import { buttonStyles } from "@/components/ui/buttonStyles";

const input = "min-h-12 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
// 按鈕樣式一律取自 components/ui/Button，不在此另開複本（見該檔開頭說明）。
const button = buttonStyles();
export default function RoomTypeSettings({ data }: { data: DemoDomain }) {
  const [name, setName] = useState(""); const [price, setPrice] = useState<"精緻" | "VIP" | "VILLA">("精緻"); const [message, setMessage] = useState("");
  function run(action: () => void) { try { action(); setMessage("房型主檔已儲存，既有合約價格保留。"); } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); } }
  return <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"><h2 className="font-semibold">房型維護</h2><p className="text-sm text-stone-600">房型名稱可自訂，計價仍對應 v24 的三種示範基準；更名不改寫既有合約價格。</p>{data.roomTypes.map((type) => <div className="flex flex-wrap gap-3" key={type.id}><input aria-label={`${type.name}房型名稱`} className={input} defaultValue={type.name} onBlur={(event) => { if (event.target.value !== type.name) run(() => babycamActions.roomType(type.id, event.target.value, type.priceCategory)); }} /><span className="self-center text-sm">計價基準 {type.priceCategory}</span><button type="button" className={button} onClick={() => run(() => babycamActions.roomType(type.id, type.name, type.priceCategory, true))}>刪除房型</button></div>)}<div className="flex flex-wrap gap-3"><input aria-label="新增房型名稱" className={input} value={name} onChange={(event) => setName(event.target.value)} /><select aria-label="新房型示範計價基準" className={input} value={price} onChange={(event) => setPrice(event.target.value as typeof price)}>{["精緻", "VIP", "VILLA"].map((item) => <option key={item}>{item}</option>)}</select><button type="button" className={button} onClick={() => run(() => { babycamActions.roomType("", name, price); setName(""); })}>新增房型</button></div>{message && <p role="status" className="text-sm">{message}</p>}</section>;
}
