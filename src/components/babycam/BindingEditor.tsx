"use client";

import { useState } from "react";
import { babycamActions } from "@/lib/babycam/actions";
import type { DemoDomain, ViewingBinding } from "@/lib/domain/types";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
const button = "min-h-12 rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100";

export default function BindingEditor({ data, binding, onChange }: { data: DemoDomain; binding: ViewingBinding; onChange: () => void }) {
  const [babyId, setBabyId] = useState("");
  const [name, setName] = useState("");
  const [cartNo, setCartNo] = useState("");
  const [birthDate, setBirthDate] = useState("2026-10-01");
  const [sex, setSex] = useState<"男" | "女">("男");
  const [birthOrder, setBirthOrder] = useState(0);
  const [cameraId, setCameraId] = useState(data.cameras[0]?.id ?? "");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [message, setMessage] = useState("");
  const candidates = data.subjects.filter((subject) => subject.caseId === binding.caseId && subject.kind === "baby");
  const assigned = binding.babies.find((baby) => baby.babyId === babyId);

  function selectBaby(id: string) {
    const subject = candidates.find((item) => item.id === id);
    const baby = binding.babies.find((item) => item.babyId === id);
    setBabyId(id); setName(subject?.name ?? ""); setCartNo(baby?.cartNo ?? subject?.carNo ?? "");
    setBirthDate(subject?.birthDate ?? "2026-10-01"); setSex(subject?.gender === "女" ? "女" : "男");
    setBirthOrder(baby?.birthOrder ?? (binding.babies.length ? binding.babies.length + 1 : 0));
    setCameraId(baby?.cameraId ?? data.cameras.find((camera) => camera.enabled && !data.bindings.some((item) => !item.ended && item.babies.some((child) => child.cameraId === camera.id)))?.id ?? data.cameras[0]?.id ?? "");
    setConfirmRemove(false); setMessage("");
  }
  function save() {
    try {
      babycamActions.assign(binding.id, { babyId: babyId || undefined, name, cartNo, birthDate, sex, birthOrder, cameraId });
      setMessage(assigned ? "已更新原指派；照護、標籤與觀看端同步。" : "已指派，寶寶照護頁與視訊同步更新。");
      onChange();
    } catch (error) { setMessage(error instanceof Error ? error.message : "指派失敗。"); }
  }
  return <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
    <h2 className="font-semibold">指派寶寶、車號與監視器</h2>
    <label className="block space-y-2 text-sm">新增或編輯寶寶<select aria-label="新增或編輯寶寶" className={input} value={babyId} onChange={(event) => selectBaby(event.target.value)}><option value="">新增一位寶寶</option>{candidates.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}｜{binding.babies.some((baby) => baby.babyId === subject.id) ? "已指派" : "待重新指派"}｜病歷 {subject.chartNo}</option>)}</select></label>
    <p className="text-sm text-stone-600">多胞胎新增前，先將第一位胎序 0 改為 1，再分別指派胎序 2、3。編輯原指派保留識別碼與照護紀錄。</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm">寶寶姓名<input aria-label="寶寶姓名" className={input} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="text-sm">車號<input aria-label="車號" className={input} value={cartNo} onChange={(event) => setCartNo(event.target.value)} /></label>
      <label className="text-sm">出生日期<input aria-label="出生日期" type="date" className={input} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
      <label className="text-sm">性別<select aria-label="性別" className={input} value={sex} onChange={(event) => setSex(event.target.value as "男" | "女")}><option>男</option><option>女</option></select></label>
      <label className="text-sm">胎序（單胞胎 0）<input aria-label="胎序（單胞胎 0）" type="number" className={input} min={0} value={birthOrder} onChange={(event) => setBirthOrder(Number(event.target.value))} /></label>
      <label className="text-sm">監視器<select aria-label="監視器" className={input} value={cameraId} onChange={(event) => setCameraId(event.target.value)}>{data.cameras.map((camera) => <option key={camera.id} value={camera.id} disabled={!camera.enabled}>{camera.code}{camera.enabled ? "" : "（停用）"}</option>)}</select></label>
    </div>
    <div className="flex flex-wrap gap-3"><button type="button" className={button} onClick={save}>{assigned ? "儲存原寶寶指派" : "指派新寶寶"}</button>{assigned && <button type="button" className={button} onClick={() => setConfirmRemove(true)}>解除此寶寶指派</button>}</div>
    {confirmRemove && <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><p>確認解除 {name} 的監視器與車號？原照護紀錄保留，舊識別標籤失效；重新指派後須重印標籤。</p><button type="button" className={button} onClick={() => { try { babycamActions.unassign(binding.id, babyId); selectBaby(babyId); setMessage("已解除，照護紀錄保留，舊標籤失效。"); onChange(); } catch (error) { setMessage(error instanceof Error ? error.message : "解除失敗。"); } }}>確認解除指派</button><button type="button" className={button} onClick={() => setConfirmRemove(false)}>保留原指派</button></div>}
    {message && <p role="status" className="rounded-lg bg-stone-50 p-3 text-sm">{message}</p>}
  </section>;
}
