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

/*
  胎別（客戶 2026-10-29）：原本是一個「胎序（單胞胎 0）」的數字框，護理人員要先知道
  0 代表單胞胎才填得對。改成先選胎別，再決定是不是要指定第幾位：
    單胞胎 → birthOrder 0（不加字母）
    雙胞胎 → A／B 二選一 → 1 或 2
    多胞胎 → 自行輸入第幾位 → N（標籤取第 N 個字母）
  資料模型沒變，birthOrder 仍是「這一位是第幾個」——標籤的 A／B／C 由它決定。
*/
const BIRTH_KINDS = ["單胞胎", "雙胞胎", "多胞胎"] as const;
type BirthKind = (typeof BIRTH_KINDS)[number];

/** 由胎序與同胞數回推要亮哪顆按鈕。三胞胎的第 1、2 位靠同胞數才分得出來。 */
function birthKindOf(order: number, siblings: number): BirthKind {
  if (order === 0) return "單胞胎";
  return Math.max(siblings, order) >= 3 ? "多胞胎" : "雙胞胎";
}

export default function BindingEditor({ data, binding, onChange }: { data: DemoDomain; binding: ViewingBinding; onChange: () => void }) {
  const candidates = data.subjects.filter((subject) => subject.caseId === binding.caseId && subject.kind === "baby");
  /* 新增一位時的胎序要接在既有寶寶後面（已有兩位 → 第 3 位），否則單胞胎 0。
     少了這段，203 房那種已有雙胞胎的案件按「＋ 新增寶寶」會停在「單胞胎 0」，
     直接存會被 assign 的多胞胎檢查擋下。 */
  const nextOrder = binding.babies.length ? binding.babies.length + 1 : 0;

  /** 第一支沒人用的監視器——cameras[0] 幾乎永遠已被 A01 的寶寶占用，拿它當預設會讓
      晶片網格同時顯示「已選取」又「已指派」，看起來像可以重複指派。 */
  function firstFreeCamera() {
    return (
      data.cameras.find((camera) => camera.enabled && !data.bindings.some((item) => !item.ended && item.babies.some((baby) => baby.cameraId === camera.id)))?.id ??
      data.cameras[0]?.id ??
      ""
    );
  }

  /** 一位寶寶（或空字串＝新增）對應的整組欄位值；初始掛載與切換寶寶共用同一份推導。 */
  function draftFor(id: string) {
    const subject = candidates.find((item) => item.id === id);
    const baby = binding.babies.find((item) => item.babyId === id);
    const sex: "男" | "女" = subject?.gender === "女" ? "女" : "男";
    const order = baby?.birthOrder ?? nextOrder;
    return {
      babyId: id,
      sex,
      order,
      name: orDemo(subject?.name, babyDisplayName(binding.motherName, sex, order) || DEMO_BABY_NAME),
      cartNo: baby?.cartNo ?? subject?.carNo ?? "",
      birthDate: subject?.birthDate ?? "2026-10-01",
      cameraId: baby?.cameraId ?? firstFreeCamera(),
    };
  }

  /* 已經有寶寶的入住一進畫面就載入第一位：護理人員這時多半是來編輯或換監視器，
     不是再加一位。真的要加再按「＋ 新增寶寶」。binding 換人時由 key 重掛。 */
  const initial = draftFor(binding.babies[0]?.babyId ?? "");
  const [babyId, setBabyId] = useState(initial.babyId);
  const [name, setName] = useState(initial.name);
  const [cartNo, setCartNo] = useState(initial.cartNo);
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [sex, setSex] = useState<"男" | "女">(initial.sex);
  const [birthOrder, setBirthOrder] = useState(initial.order);
  const [birthKind, setBirthKind] = useState<BirthKind>(() => birthKindOf(initial.order, binding.babies.length));
  const [cameraId, setCameraId] = useState(initial.cameraId);
  const [zone, setZone] = useState("全部");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [reason, setReason] = useState(CHANGE_REASONS[0]);
  const [message, setMessage] = useState("");
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

  /** 換胎別時順手給一個合理的胎序：單胞胎 0、雙胞胎從 A、多胞胎從第 3 位起。 */
  function pickKind(next: BirthKind) {
    const order = next === "單胞胎" ? 0 : next === "雙胞胎" ? (birthOrder === 2 ? 2 : 1) : Math.max(3, birthOrder);
    retitle(sex, order);
    setBirthKind(next);
    setBirthOrder(order);
  }

  function pickOrder(order: number) {
    retitle(sex, order);
    setBirthOrder(order);
  }

  function selectBaby(id: string) {
    const draft = draftFor(id);
    setBabyId(draft.babyId); setName(draft.name); setCartNo(draft.cartNo);
    setBirthDate(draft.birthDate); setSex(draft.sex);
    setBirthOrder(draft.order); setBirthKind(birthKindOf(draft.order, binding.babies.length));
    setCameraId(draft.cameraId);
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
    {/*
      這筆入住的寶寶改用按鈕列，不用下拉（客戶 2026-10-29）：下拉要點開才知道有幾位、
      誰已指派，而護理人員在現場最常做的就是「在兩位之間切換」。每顆帶監視器代號與
      病歷號，看一眼就知道按哪一顆。
    */}
    <fieldset className="space-y-2 border-0 p-0">
      <legend className="pb-2 text-sm font-semibold text-stone-700">這筆入住的寶寶</legend>
      <div className="flex flex-wrap gap-2">
        {candidates.map((subject) => {
          const baby = binding.babies.find((item) => item.babyId === subject.id);
          return (
            <button
              key={subject.id}
              type="button"
              aria-pressed={babyId === subject.id}
              className={buttonStyles({ selected: babyId === subject.id, className: "h-auto flex-col items-start gap-0.5 py-2 text-left" })}
              onClick={() => selectBaby(subject.id)}
            >
              <span className="font-semibold">{subject.name}</span>
              <span className="text-xs font-normal opacity-80">
                {baby ? `${data.cameras.find((camera) => camera.id === baby.cameraId)?.code ?? "未設定"}・車號 ${baby.cartNo}` : "待重新指派"}｜病歷 {subject.chartNo}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={!babyId}
          className={buttonStyles({ selected: !babyId, className: "h-auto py-2" })}
          onClick={() => selectBaby("")}
        >
          ＋ 新增寶寶
        </button>
      </div>
      <p className="text-sm text-stone-600">{babyId ? "編輯原指派保留識別碼與照護紀錄；換監視器會留下歷程。" : "填好資料後按「指派新寶寶」。多胞胎請在下方選胎別並指定第幾位。"}</p>
    </fieldset>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm">寶寶姓名<input aria-label="寶寶姓名" className={input} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="text-sm">車號<input aria-label="車號" className={input} value={cartNo} onChange={(event) => setCartNo(event.target.value)} /></label>
      <label className="text-sm">出生日期<input aria-label="出生日期" type="date" className={input} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
      <label className="text-sm">性別<select aria-label="性別" className={input} value={sex} onChange={(event) => { const next = event.target.value as "男" | "女"; retitle(next, birthOrder); setSex(next); }}><option>男</option><option>女</option></select></label>
    </div>
    <fieldset className="space-y-2 border-0 p-0">
      <legend className="pb-2 text-sm font-semibold text-stone-700">胎別</legend>
      <div className="flex flex-wrap items-center gap-2">
        {BIRTH_KINDS.map((item) => (
          <button key={item} type="button" aria-pressed={birthKind === item} className={buttonStyles({ selected: birthKind === item })} onClick={() => pickKind(item)}>{item}</button>
        ))}
        {birthKind === "雙胞胎" && (
          <span className="flex items-center gap-2 border-l border-stone-200 pl-3 text-sm text-stone-600">
            這位是
            {[1, 2].map((order) => (
              <button key={order} type="button" aria-pressed={birthOrder === order} className={buttonStyles({ size: "sm", selected: birthOrder === order })} onClick={() => pickOrder(order)}>
                {String.fromCharCode(64 + order)}（第 {order} 位）
              </button>
            ))}
          </span>
        )}
        {birthKind === "多胞胎" && (
          <label className="flex items-center gap-2 border-l border-stone-200 pl-3 text-sm text-stone-600">
            這位是第
            <input aria-label="這一胎的第幾位" type="number" className="min-h-12 w-20 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" min={1} max={26} value={birthOrder} onChange={(event) => pickOrder(Number(event.target.value))} />
            位（標籤印 {birthOrder >= 1 && birthOrder <= 26 ? String.fromCharCode(64 + birthOrder) : "—"}）
          </label>
        )}
      </div>
      <p className="text-xs text-stone-500">單胞胎的標籤不加字母；雙胞胎與多胞胎依序加 A、B、C，兩張手圈才分得出誰是誰。</p>
    </fieldset>
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
