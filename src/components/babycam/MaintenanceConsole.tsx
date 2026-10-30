"use client";

import { useState } from "react";
import { report, reportFail } from "@/lib/demo/lenient";
import { Toast, useToast } from "@/components/ui/Toast";
import { babycamActions, canBabycamSection } from "@/lib/babycam/actions";
import { initialDemoScenario, type DemoScenarioAction } from "@/lib/babycam/demo-scenario";
import type { CameraRecord, DemoDomain } from "@/lib/domain/types";
import { buttonStyles } from "@/components/ui/buttonStyles";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
// 按鈕樣式一律取自 components/ui/Button，不在此另開複本（見該檔開頭說明）。
const button = buttonStyles();

export default function MaintenanceConsole({ data, camera }: { data: DemoDomain; camera: CameraRecord }) {
  const state = data.demoScenarios[camera.id] ?? initialDemoScenario();
  const [draft, setDraft] = useState(data.detection); const [toast, toastProps] = useToast();
  function run(action: () => void) { try { action(); report(toast, "已更新本機模擬狀態，未呼叫設備服務。"); } catch (error) { reportFail(toast, error); } }
  const scenario = (action: DemoScenarioAction) => run(() => babycamActions.scenario(camera.id, action));
  return <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"><h2 className="font-semibold">{camera.code} 離車、偵測與人工歸位情境</h2><p className="text-sm">目前 {{ normal: "正常", departing: "累計異常樣本", care: "已遮蔽，寶寶照護中", returned: "已回到鏡頭，等待掃碼核對", restored: "人工核對恢復", fault: "偵測服務異常" }[state.phase]}｜異常樣本 {state.abnormalSamples}</p><div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => scenario({ type: "reset" })}>還原此鏡頭正常情境</button><button type="button" className={button} onClick={() => scenario({ type: "cart-away", now: Date.parse(data.demoAt) })}>模擬離車</button><button type="button" className={button} onClick={() => scenario({ type: "sample" })}>再取一筆異常樣本</button><button type="button" className={button} onClick={() => scenario({ type: "tick", now: Date.parse(data.demoAt) + 5000 })}>模擬經過 5 秒</button><button type="button" className={button} onClick={() => scenario({ type: "cart-back" })}>模擬回到鏡頭</button><button type="button" className={button} onClick={() => scenario({ type: "fault" })}>模擬偵測故障</button>{(["idle", "internal", "family"] as const).map((viewer) => <button type="button" key={viewer} className={button} aria-pressed={state.viewer === viewer} onClick={() => scenario({ type: "view", viewer })}>模擬{{ idle: "無人觀看", internal: "院內觀看", family: "親友觀看" }[viewer]}</button>)}</div><p className="text-sm text-stone-600">回到鏡頭後仍保持遮蔽，請由寶寶登錄頁核對原識別碼後恢復；多胞胎只影響所選鏡頭的寶寶。</p>{canBabycamSection(data, "04") && <details><summary className="min-h-12 cursor-pointer text-sm">偵測模擬設定</summary><label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />啟用基準檢查模擬（預設關閉）</label><div className="grid gap-3 sm:grid-cols-2">{([["threshold", "差異門檻（0.02–0.8）"], ["streak", "連續次數（1–10）"], ["intervalSeconds", "模擬取樣間隔（秒）"], ["maxAgeSeconds", "截圖最大有效時間（秒）"]] as const).map(([key, label]) => <label className="text-sm" key={key}>{label}<input aria-label={label} className={input} type="number" step={key === "threshold" ? "0.01" : "1"} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} /></label>)}</div><button type="button" className={`${button} mt-3`} onClick={() => run(() => babycamActions.detection(draft))}>儲存偵測模擬設定</button><p className="mt-2 text-xs text-stone-600">設定僅供操作與結果示範，不建立影像辨識或抓圖服務。</p></details>}<Toast {...toastProps} /></section>;
}
