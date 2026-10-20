"use client";

import { useState } from "react";
import { babycamActions } from "@/lib/babycam/actions";
import { LIGHT_COLORS } from "@/lib/babycam/lights";
import type { DemoDomain } from "@/lib/domain/types";
import { buttonStyles } from "@/components/ui/buttonStyles";

const input = "min-h-12 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
// 按鈕樣式一律取自 components/ui/Button，不在此另開複本（見該檔開頭說明）。
const button = buttonStyles();
export default function LightSettings({ data }: { data: DemoDomain }) {
  const [name, setName] = useState(""); const [color, setColor] = useState("白"); const [message, setMessage] = useState("");
  function run(action: () => void) { try { action(); setMessage("已更新模擬燈號狀態。"); } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); } }
  return <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"><h2 className="font-semibold">燈號狀態與 RGB 混色</h2><p className="text-sm">五種內建狀態可改名稱與燈色；自訂狀態供點測對照，不會自行套用到業務判定。</p>{Object.entries(data.lightColors).map(([key, value]) => <div className="flex flex-wrap gap-3" key={key}><input aria-label={`${key}燈號名稱`} className={input} defaultValue={data.lightLabels[key] ?? key} onBlur={(event) => { if (event.target.value !== data.lightLabels[key]) run(() => babycamActions.lightColor(key, value, event.target.value)); }} /><select aria-label={`${key}燈色`} className={input} value={value} onChange={(event) => run(() => babycamActions.lightColor(key, event.target.value))}>{LIGHT_COLORS.map((item) => <option key={item}>{item}</option>)}</select>{!["empty", "care", "idle", "internal", "family"].includes(key) && <button type="button" className={button} onClick={() => run(() => babycamActions.removeLight(key))}>刪除自訂狀態</button>}</div>)}<div className="flex flex-wrap gap-3"><input aria-label="新增燈號狀態名稱" className={input} value={name} onChange={(event) => setName(event.target.value)} /><select aria-label="新增燈色" className={input} value={color} onChange={(event) => setColor(event.target.value)}>{LIGHT_COLORS.map((item) => <option key={item}>{item}</option>)}</select><button type="button" className={button} onClick={() => run(() => { if (!name.trim()) throw new Error("請填自訂狀態名稱。"); babycamActions.lightColor(`custom-${crypto.randomUUID()}`, color, name); setName(""); })}>新增自訂燈號</button></div>{message && <p role="status" className="text-sm">{message}</p>}</section>;
}
