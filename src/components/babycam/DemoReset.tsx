"use client";

import { useState } from "react";
import { resetIntegratedDemo } from "@/lib/demo/reset";
import { buttonStyles } from "@/components/ui/buttonStyles";

export default function DemoReset() {
  const [confirm, setConfirm] = useState(false); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  return <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4"><h2 className="font-semibold">還原整合展示資料</h2><p className="text-sm">還原本機案件、照護草稿／歷史、視訊與相關設定，並清除本機照片；原有片語庫與評估題目設定保留。</p>{!confirm ? <button type="button" className={buttonStyles()} onClick={() => setConfirm(true)}>還原展示資料</button> : <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><p>確認捨棄目前瀏覽器的整合展示紀錄與照片？請先保存需要的內容。</p><button type="button" disabled={busy} className={buttonStyles()} onClick={async () => { setBusy(true); try { await resetIntegratedDemo(); setConfirm(false); setMessage("展示資料已還原。"); } catch (error) { setMessage(error instanceof Error ? error.message : "還原失敗。"); } finally { setBusy(false); } }}>確認還原整合資料</button><button type="button" className={buttonStyles({ className: "ml-3" })} onClick={() => setConfirm(false)}>保留目前資料</button></div>}{message && <p role="status" className="text-sm">{message}</p>}</section>;
}
