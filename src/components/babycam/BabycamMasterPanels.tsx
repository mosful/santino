"use client";

import { useState } from "react";
import { Toast, useToast } from "@/components/ui/Toast";
import { babycamActions } from "@/lib/babycam/actions";
import { DEFAULT_PRINT_SETTINGS, type PrintSettings } from "@/lib/babycam/wristband-print";
import type { CameraRecord, DemoDomain } from "@/lib/domain/types";
import { ROLES } from "@/lib/permissions";
import { buttonStyles } from "@/components/ui/buttonStyles";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
// 按鈕樣式一律取自 components/ui/Button，不在此另開複本（見該檔開頭說明）。
const button = buttonStyles();
const panel = "space-y-4 rounded-xl border border-stone-200 bg-white p-4";

export function CameraMetadata({ camera }: { camera: CameraRecord }) {
  const [draft, setDraft] = useState({ code: camera.code, codec: camera.codec ?? "H.264", sourceType: camera.sourceType ?? "匿名快照", sourceLabel: camera.sourceLabel ?? `展示-${camera.code}`, resolution: camera.resolution ?? "1920×1080" });
  const [toast, toastProps] = useToast();
  return <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-3">{(["code", "codec", "sourceType", "sourceLabel", "resolution"] as const).map((key) => <label key={key} className="text-sm">{{ code: "監視器編號", codec: "編碼格式", sourceType: "來源類型", sourceLabel: "匿名來源代號", resolution: "解析度" }[key]}{key === "codec" || key === "sourceType" ? <select className={input} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}>{(key === "codec" ? ["H.264", "HEVC"] : ["匿名快照", "匿名串流", "本機示意"]).map((item) => <option key={item}>{item}</option>)}</select> : <input className={input} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />}</label>)}</div><button type="button" className={button} onClick={() => { try { babycamActions.camera(camera.id, draft); toast.ok("已儲存主檔，不會連線匿名來源。"); } catch (error) { toast.fail(error instanceof Error ? error.message : "儲存失敗。"); } }}>儲存監視器主檔</button><Toast {...toastProps} /></div>;
}

export function StaffEditor({ staff }: { staff: DemoDomain["staff"][number] }) {
  const [name, setName] = useState(staff.name);
  const [role, setRole] = useState(staff.role);
  const [toast, toastProps] = useToast();
  function save(enabled: boolean) { try { babycamActions.staff(staff.id, name, role, enabled); toast.ok("已儲存展示員工。"); } catch (error) { toast.fail(error instanceof Error ? error.message : "儲存失敗。"); } }
  return <div className="space-y-2 border-b border-stone-200 pb-3"><div className="flex flex-wrap gap-3"><input aria-label={`${staff.name}姓名`} className={`${input} sm:w-48`} value={name} onChange={(event) => setName(event.target.value)} /><select aria-label={`${staff.name}角色`} className={`${input} sm:w-48`} value={role} onChange={(event) => setRole(event.target.value)}>{ROLES.map((item) => <option key={item}>{item}</option>)}</select><button type="button" className={button} onClick={() => save(staff.enabled)}>儲存員工</button><button type="button" className={button} onClick={() => save(!staff.enabled)}>{staff.enabled ? "停用" : "啟用"}</button></div><Toast {...toastProps} /></div>;
}

export function PrintSettingsEditor({ value, onSaved }: { value: PrintSettings; onSaved: () => void }) {
  const [draft, setDraft] = useState(value);
  const [toast, toastProps] = useToast();
  const labels: [keyof PrintSettings, string][] = [["qrModule", "QR 每格點數（0 自動）"], ["qrQuiet", "QR 靜區格數"], ["qrGap", "QR 與文字間距（點）"], ["textGap", "文字行距（點）"], ["left", "整體左移補償（mm）"], ["gap", "雙排間距（mm）"], ["top", "整體上下微調（mm）"], ["textLeft", "文字左右微調（mm）"], ["textTop", "文字上下微調（mm）"], ["unprintableTop", "上方不可列印（mm）"], ["unprintableRight", "右側不可列印（mm）"]];
  return <details className={panel}><summary className="cursor-pointer font-semibold">標籤列印設定</summary><p className="text-sm">40 × 15 mm 雙排版型。設定及預覽只在本機模擬，實體印表機仍須現場校正。</p><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">字體<select aria-label="標籤字體" className={input} value={draft.font} onChange={(event) => setDraft({ ...draft, font: event.target.value as PrintSettings["font"] })}><option value="jhenghei">正黑體</option><option value="kai">標楷體</option><option value="ming">明體</option></select></label><label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" checked={draft.bold} onChange={(event) => setDraft({ ...draft, bold: event.target.checked })} />粗體</label>{labels.map(([key, label]) => <label className="text-sm" key={key}>{label}<input aria-label={label} type="number" step="0.1" className={input} value={Number(draft[key])} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} /></label>)}</div>{draft.lines.map((line, index) => <div key={index} className="grid items-center gap-3 sm:grid-cols-4"><label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" checked={line.show} onChange={(event) => setDraft({ ...draft, lines: draft.lines.map((old, i) => i === index ? { ...old, show: event.target.checked } : old) })} />第 {index + 1} 行</label>{(["title", "titleSize", "valueSize"] as const).map((key) => <label className="text-sm" key={key}>{key === "title" ? "標題" : key === "titleSize" ? "標題字級" : "內容字級"}<input aria-label={`第${index + 1}行${key}`} className={input} type={key === "title" ? "text" : "number"} value={line[key]} onChange={(event) => setDraft({ ...draft, lines: draft.lines.map((old, i) => i === index ? { ...old, [key]: key === "title" ? event.target.value : Number(event.target.value) } : old) })} /></label>)}</div>)}<div className="flex flex-wrap gap-3"><button type="button" className={button} onClick={() => { try { babycamActions.printSettings(draft); onSaved(); toast.ok("已儲存，請重新產生標籤預覽。"); } catch (error) { toast.fail(error instanceof Error ? error.message : "儲存失敗。"); } }}>儲存列印設定</button><button type="button" className={button} onClick={() => setDraft(structuredClone(DEFAULT_PRINT_SETTINGS))}>帶入預設設定</button></div><Toast {...toastProps} /></details>;
}
