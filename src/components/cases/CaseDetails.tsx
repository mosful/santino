"use client";

import { useState } from "react";
import { caseActions } from "@/lib/demo/domainStore";
import { dailyCharges } from "@/lib/domain/rules";
import { useCurrentRole } from "@/lib/roleStore";
import { saveCarePhoto } from "@/lib/care/media";
import type { CaseRecord } from "@/lib/domain/types";
import LocalMedia from "../babycam/LocalMedia";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
const button = "min-h-12 rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-40";

export function DailyLedger({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const role = useCurrentRole();
  const [entryId, setEntryId] = useState(""); const [amount, setAmount] = useState(""); const [reason, setReason] = useState(""); const [message, setMessage] = useState("");
  const rows = dailyCharges(record);
  return <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"><h2 className="font-semibold">逐日房租與自費明細</h2><p className="text-sm text-stone-600">原合約金額按原付費日分攤，最後付費日調整尾差；贈送日為 0。變更與自費另列，不更動原合約快照。</p><div className="max-h-96 overflow-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead><tr><th className="p-2">日期</th><th className="p-2">項目</th><th className="p-2 text-right">金額</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-stone-200"><td className="p-2">{row.date}</td><td className="p-2">{row.label}</td><td className="p-2 text-right tabular-nums">{row.amount.toLocaleString("zh-TW")}</td></tr>)}</tbody></table></div>{editable && ["護理長 婉真", "管理者"].includes(role) && <details><summary className="min-h-12 cursor-pointer text-sm">主管帳務例外調整</summary><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">原收費項目<select aria-label="例外調整項目" className={input} value={entryId} onChange={(event) => { setEntryId(event.target.value); setAmount(""); }}><option value="">請選擇自費／變更項目</option>{record.ledger.filter((entry) => !entry.adjustsId).map((entry) => <option value={entry.id} key={entry.id}>{entry.date}｜{entry.label}</option>)}</select></label><label className="text-sm">修正後金額<input aria-label="例外修正後金額" type="number" className={input} value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label className="sm:col-span-2 text-sm">急診／例外原因<input aria-label="帳務例外原因" className={input} value={reason} onChange={(event) => setReason(event.target.value)} /></label><button type="button" className={button} onClick={() => { try { if (!amount.trim()) throw new Error("請填修正後金額。"); caseActions.adjustCharge(record.id, entryId, Number(amount), reason); setMessage("已加列差額、保留原項目與主管授權紀錄。"); } catch (error) { setMessage(error instanceof Error ? error.message : "調整失敗。"); } }}>授權並加列調整</button></div></details>}{message && <p role="status" className="text-sm">{message}</p>}</section>;
}

export function AdmissionMeal({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const [people, setPeople] = useState(record.meal?.people ?? 1); const [content, setContent] = useState(record.meal?.content ?? "一般餐"); const [message, setMessage] = useState("");
  return <section className="sm:col-span-2 space-y-3"><h3 className="font-medium">入住當天餐飲</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">餐飲人數<input aria-label="餐飲人數" type="number" min={1} max={10} disabled={!editable} className={input} value={people} onChange={(event) => setPeople(Number(event.target.value))} /></label><label className="text-sm">餐飲內容<input aria-label="餐飲內容" disabled={!editable} className={input} value={content} onChange={(event) => setContent(event.target.value)} /></label></div><button type="button" disabled={!editable} className={button} onClick={() => { try { caseActions.meal(record.id, people, content); setMessage("已保存入住當天餐飲。"); } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); } }}>儲存入住當天餐飲</button><p className="text-xs text-stone-600">以展示控制台日期判定入住當天，其他日期依變更流程處理。</p>{message && <p role="status" className="text-sm">{message}</p>}</section>;
}

export function ReturnPhotos({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const [email, setEmail] = useState(record.returnEmail ?? "demo@example.test"); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  return <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"><h2 className="font-semibold">返家照片留存與寄送示意</h2><input aria-label="返家照片" type="file" accept="image/*" disabled={!editable || busy} className={input} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); try { caseActions.returnPhoto(record.id, await saveCarePhoto(file)); setMessage("照片已留存在本機瀏覽器。"); } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); } finally { setBusy(false); event.target.value = ""; } }} /><div className="grid gap-3 sm:grid-cols-3">{record.returnPhotos?.map((id) => <LocalMedia key={id} id={id} alt="匿名返家照片" className="aspect-video w-full rounded-lg object-cover" />)}</div><label className="block space-y-2 text-sm">展示收件 Email<input aria-label="展示收件 Email" className={input} disabled={!editable} value={email} onChange={(event) => setEmail(event.target.value)} /></label><button type="button" className={button} disabled={!editable} onClick={() => { try { caseActions.simulateReturnMail(record.id, email); setMessage("寄送示意已記錄，未寄出郵件。"); } catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗。"); } }}>模擬寄送返家照片</button><p className="text-sm">寄送示意紀錄 {record.returnMailLog?.length ?? 0} 次；不連線郵件服務。</p>{message && <p role="status" className="text-sm">{message}</p>}</section>;
}
