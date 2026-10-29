"use client";

import { useState } from "react";
import { babycamActions } from "@/lib/babycam/actions";
import type { DemoDomain, ViewingBinding } from "@/lib/domain/types";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { CameraChipGrid, ZoneFilter } from "./BabycamUi";
import { DEMO_BABY_NAME, orDemo } from "@/lib/demo/demoDefaults";
import { babyDisplayName } from "@/lib/babycam/wristband";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
// 按鈕樣式一律取自 components/ui/Button，不在此另開複本（見該檔開頭說明）。
const button = buttonStyles();
/* 換鏡頭的常見情境（客戶 2026-10-29）：寶寶感冒移到隔離房、好了推回原位、
   原鏡頭故障。選單化而不是自由輸入，現場才不會每個人寫法不同。 */
const CHANGE_REASONS = ["移至隔離房", "隔離結束歸位", "原監視器故障", "房間消毒", "其他"];

export default function BindingEditor({ data, binding, onChange }: { data: DemoDomain; binding: ViewingBinding; onChange: () => void }) {
  const [babyId, setBabyId] = useState("");
  const [name, setName] = useState(() => (binding.motherName ? babyDisplayName(binding.motherName, "男", 0) : DEMO_BABY_NAME));
  const [cartNo, setCartNo] = useState("");
  const [birthDate, setBirthDate] = useState("2026-10-01");
  const [sex, setSex] = useState<"男" | "女">("男");
  const [birthOrder, setBirthOrder] = useState(0);
  /* 預設落在「第一支沒人用的監視器」而不是 cameras[0]——後者幾乎永遠已被 A01 的寶寶占用，
     晶片網格會同時顯示「已選取」又「已指派」，看起來像可以重複指派。 */
  const [cameraId, setCameraId] = useState(
    () =>
      data.cameras.find(
        (camera) =>
          camera.enabled &&
          !data.bindings.some((item) => !item.ended && item.babies.some((baby) => baby.cameraId === camera.id)),
      )?.id ??
      data.cameras[0]?.id ??
      "",
  );
  const [zone, setZone] = useState("全部");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [reason, setReason] = useState(CHANGE_REASONS[0]);
  const [message, setMessage] = useState("");
  const candidates = data.subjects.filter((subject) => subject.caseId === binding.caseId && subject.kind === "baby");
  const assigned = binding.babies.find((baby) => baby.babyId === babyId);
  // 新的在上：現場想知道的是「現在在哪一支、上一支是哪一支」。
  const history = data.cameraIntervals.filter((item) => item.babyId === babyId).slice().reverse();
  /* 已被其他寶寶占用的監視器（含本筆的其他寶寶）；晶片上會標成虛線「已指派」而不是消失，
     現場才看得出來「那支不是壞了，是別人在用」。 */
  const taken = data.bindings
    .filter((item) => !item.ended)
    .flatMap((item) => item.babies)
    .filter((baby) => baby.babyId !== babyId)
    .map((baby) => baby.cameraId);
  const zoneCameras = data.cameras.filter((camera) => (camera.enabled || camera.id === cameraId) && (zone === "全部" || camera.code.startsWith(zone)));

  /* 寶寶姓名預設跟著媽媽、性別與胎序走（雙胞胎才會有 A／B）；護理師若自己打過字就不再覆蓋。
     手圈標籤印的是這個欄位（wristband-print 只在它空白時才回頭推導），所以要在這裡就對。 */
  const autoName = babyDisplayName(binding.motherName, sex, birthOrder);
  function retitle(nextSex: "男" | "女", nextOrder: number) {
    if (name === autoName) setName(babyDisplayName(binding.motherName, nextSex, nextOrder));
  }

  function selectBaby(id: string) {
    const subject = candidates.find((item) => item.id === id);
    const baby = binding.babies.find((item) => item.babyId === id);
        const nextSex = subject?.gender === "女" ? "女" : "男";
    const nextOrder = baby?.birthOrder ?? (binding.babies.length ? binding.babies.length + 1 : 0);
    setBabyId(id); setName(orDemo(subject?.name, babyDisplayName(binding.motherName, nextSex, nextOrder) || DEMO_BABY_NAME)); setCartNo(baby?.cartNo ?? subject?.carNo ?? "");
    setBirthDate(subject?.birthDate ?? "2026-10-01"); setSex(nextSex);
    setBirthOrder(nextOrder);
    setCameraId(baby?.cameraId ?? data.cameras.find((camera) => camera.enabled && !data.bindings.some((item) => !item.ended && item.babies.some((child) => child.cameraId === camera.id)))?.id ?? data.cameras[0]?.id ?? "");
    setConfirmRemove(false); setMessage("");
  }
  function save() {
    try {
      babycamActions.assign(binding.id, { babyId: babyId || undefined, name, cartNo, birthDate, sex, birthOrder, cameraId, reason });
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
      <label className="text-sm">性別<select aria-label="性別" className={input} value={sex} onChange={(event) => { const next = event.target.value as "男" | "女"; retitle(next, birthOrder); setSex(next); }}><option>男</option><option>女</option></select></label>
      <label className="text-sm">胎序（單胞胎 0）<input aria-label="胎序（單胞胎 0）" type="number" className={input} min={0} value={birthOrder} onChange={(event) => { const next = Number(event.target.value); retitle(sex, next); setBirthOrder(next); }} /></label>
    </div>
    {/* 監視器用晶片挑，不用下拉選單——33 支塞進 select 一次只看得到幾支，
        護理人員在現場要做的事只是「挑一支」。與 BabyCam 的 camera-chip-grid 對齊。 */}
    <fieldset className="min-w-0 space-y-3 border-0 p-0">
      <legend className="pb-2 text-sm font-semibold text-stone-700">指派監視器</legend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ZoneFilter zones={["全部", "A", "B"]} active={zone} onSelect={setZone} />
        <span className="text-xs text-stone-500">目前選定 {data.cameras.find((camera) => camera.id === cameraId)?.code ?? "尚未選擇"}</span>
      </div>
      <CameraChipGrid cameras={zoneCameras} selectedIds={cameraId ? [cameraId] : []} takenIds={taken} onToggle={(id) => setCameraId(id)} />
      {assigned && assigned.cameraId !== cameraId && <label className="block text-sm">更換原因（寫進歷程）<select aria-label="更換原因" className={input} value={reason} onChange={(event) => setReason(event.target.value)}>{CHANGE_REASONS.map((item) => <option key={item}>{item}</option>)}</select></label>}
    </fieldset>
    {/* 換鏡頭歷程直接讀 cameraIntervals——換一次就封一段、開一段，不另外存一張表。 */}
    {babyId && history.length > 0 && <div className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-700">此寶寶的監視器歷程</h3>
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-stone-50"><tr>{["監視器", "開始", "結束", "原因"].map((label) => <th key={label} className="whitespace-nowrap p-2 font-medium">{label}</th>)}</tr></thead><tbody>
        {history.map((item) => <tr key={item.id} className="border-t border-stone-200">
          <td className="p-2">{data.cameras.find((camera) => camera.id === item.cameraId)?.code ?? item.cameraId}</td>
          <td className="p-2">{item.start}</td>
          <td className="p-2">{item.end ?? "使用中"}</td>
          <td className="p-2">{item.reason ?? "—"}</td>
        </tr>)}
      </tbody></table></div>
    </div>}
    <div className="flex flex-wrap gap-3"><button type="button" className={button} onClick={save}>{assigned ? "儲存原寶寶指派" : "指派新寶寶"}</button>{assigned && <button type="button" className={button} onClick={() => setConfirmRemove(true)}>解除此寶寶指派</button>}</div>
    {confirmRemove && <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><p>確認解除 {name} 的監視器與車號？原照護紀錄保留，舊識別標籤失效；重新指派後須重印標籤。</p><button type="button" className={button} onClick={() => { try { babycamActions.unassign(binding.id, babyId); selectBaby(babyId); setMessage("已解除，照護紀錄保留，舊標籤失效。"); onChange(); } catch (error) { setMessage(error instanceof Error ? error.message : "解除失敗。"); } }}>確認解除指派</button><button type="button" className={button} onClick={() => setConfirmRemove(false)}>保留原指派</button></div>}
    {message && <p role="status" className="rounded-lg bg-stone-50 p-3 text-sm">{message}</p>}
  </section>;
}
