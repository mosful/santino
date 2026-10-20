"use client";

import { useEffect, useState } from "react";
import { readCarePhoto, saveCarePhoto } from "@/lib/care/media";
import type { CareField, CareValues } from "@/lib/care/types";
import styles from "./CareWorkspace.module.css";
import { usePhraseLibrary } from "@/hooks/usePhraseLibrary";
import { buttonStyles } from "@/components/ui/buttonStyles";

export const inputClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100";
/** 照護模組沿用的按鈕樣式；實作在 components/ui/Button，這裡只是再匯出。 */
export const buttonClass = buttonStyles();
export const valueText = (value: string | string[] | undefined) => Array.isArray(value) ? value.join("、") : value ?? "";

function PhotoField({ id, label, onChange }: { id: string; label: string; onChange: (value: string) => void }) {
  const [source, setSource] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true; let url = "";
    if (id) void readCarePhoto(id).then((blob) => {
      if (active && blob) { url = URL.createObjectURL(blob); setSource(url); }
    }).catch(() => { if (active) setMessage("照片僅存在原瀏覽器，目前無法讀取。"); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [id]);
  return <div className="space-y-3">
    <input aria-label={label} type="file" accept="image/*" capture="environment" disabled={loading} className={inputClass} onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      setLoading(true); setMessage("");
      try { onChange(await saveCarePhoto(file)); setMessage("照片已存於本機瀏覽器，沒有對外上傳。"); }
      catch (error) { setMessage(error instanceof Error ? error.message : "圖片讀取失敗。"); }
      finally { setLoading(false); }
    }} />
    {/* 本機 Blob URL 不經 Next.js 圖片服務，維持純靜態。 */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {source && <img src={source} alt="目前個案的本機照護照片" className={styles.photo} />}
    {(message || loading) && <p className="text-xs text-stone-600" role="status">{loading ? "正在儲存本機預覽…" : message}</p>}
  </div>;
}

export default function CareFieldInput({ field, values, onChange, personal, addPhrase }: { field: CareField; values: CareValues; onChange: (patch: CareValues) => void; personal: string[]; addPhrase: (value: string) => void }) {
  const { phrases: library } = usePhraseLibrary();
  const [phraseOpen, setPhraseOpen] = useState(false);
  const [phraseTab, setPhraseTab] = useState("system");
  const [query, setQuery] = useState("");
  const id = `care-field-${field.key}`;
  const value = values[field.key];
  const phrases = (phraseTab === "system" ? library.filter((item) => [item.text, item.category, ...item.tags].join(" ").includes(query)).map((item) => item.text) : personal.filter((item) => item.includes(query)));
  return <div className={field.type === "textarea" || field.type === "photo" || field.type === "multiple" ? "sm:col-span-2" : ""}>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <label htmlFor={field.type === "multiple" || field.type === "photo" ? undefined : id} className="text-sm font-medium">{field.label}{field.required && <span className="ml-1 text-rose-700">（必填）</span>}</label>
      {field.type === "textarea" && <button type="button" onClick={() => setPhraseOpen(!phraseOpen)} aria-expanded={phraseOpen} className="text-sm underline underline-offset-4">常用片語</button>}
    </div>
    {phraseOpen && <div className="mb-3 space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3" aria-label="頁內常用片語" data-no-print>
      <div className="flex flex-wrap gap-2"><button type="button" aria-pressed={phraseTab === "system"} onClick={() => setPhraseTab("system")} className={buttonClass}>全院片語</button><button type="button" aria-pressed={phraseTab === "personal"} onClick={() => setPhraseTab("personal")} className={buttonClass}>我的常用語</button></div>
      <input aria-label="搜尋片語" placeholder="搜尋片語" value={query} onChange={(event) => setQuery(event.target.value)} className={inputClass} />
      <div className="flex flex-wrap gap-2">{phrases.map((phrase) => <button type="button" key={phrase} className={buttonClass} onClick={() => onChange({ [field.key]: [valueText(value), phrase].filter(Boolean).join("\n") })}>{phrase}</button>)}</div>
      {!phrases.length && <p className="text-sm text-stone-600">尚無符合片語，可將目前欄位內容加入常用語。</p>}
      <button type="button" className={buttonClass} onClick={() => addPhrase(valueText(value))}>將目前內容加入我的常用語</button>
    </div>}
    {field.type === "textarea" ? <textarea id={id} value={valueText(value)} onChange={(event) => onChange({ [field.key]: event.target.value })} className={inputClass} />
      : field.type === "multiple" ? <div className="flex flex-wrap gap-2" role="group" aria-label={field.label}>{field.options?.map((option) => {
        const selected = Array.isArray(value) ? value : [];
        return <label key={option} className="flex min-h-12 items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm"><input type="checkbox" checked={selected.includes(option)} onChange={() => onChange({ [field.key]: selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option] })} />{option}</label>;
      })}</div>
      : field.type === "select" ? <select id={id} value={valueText(value)} onChange={(event) => onChange({ [field.key]: event.target.value })} className={inputClass}><option value="">請選擇</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
      : field.type === "photo" ? <PhotoField key={valueText(value)} id={valueText(value)} label={field.label} onChange={(next) => onChange({ [field.key]: next })} />
      : <input id={id} type={field.type ?? "text"} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined} value={valueText(value)} onChange={(event) => onChange({ [field.key]: event.target.value })} className={inputClass} />}
  </div>;
}

export function GrowthChart({ points }: { points: { date: string; weight: number }[] }) {
  if (!points.length) return <p className="text-sm text-stone-600">完成量測簽出後，體重趨勢會同步顯示在這裡。</p>;
  const low = Math.min(...points.map((point) => point.weight)) - 100;
  const range = Math.max(200, Math.max(...points.map((point) => point.weight)) - low + 100);
  const x = (index: number) => 40 + index * 520 / Math.max(1, points.length - 1);
  const y = (weight: number) => 165 - (weight - low) / range * 130;
  return <svg viewBox="0 0 600 210" role="img" aria-label={`體重趨勢，${points.map((point) => `${point.date} ${point.weight} 公克`).join("，")}`} className="w-full max-w-3xl rounded-lg bg-stone-50">
    <polyline points={points.map((point, index) => `${x(index)},${y(point.weight)}`).join(" ")} fill="none" stroke="#0369a1" strokeWidth="3" />
    {points.map((point, index) => <g key={`${point.date}-${index}`}><circle cx={x(index)} cy={y(point.weight)} r="4" fill="#0369a1" /><text x={x(index)} y={y(point.weight) - 12} textAnchor="middle" fontSize="12">{point.weight}g</text><text x={x(index)} y="195" textAnchor="middle" fontSize="12">{point.date.slice(5)}</text></g>)}
  </svg>;
}
