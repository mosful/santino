"use client";

import { useState } from "react";
import { babycamActions } from "@/lib/babycam/actions";
import type { DemoDomain, ViewingBinding } from "@/lib/domain/types";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { CameraChipGrid, ZoneFilter } from "./BabycamUi";
import { DEMO_BABY_NAME, orDemo } from "@/lib/demo/demoDefaults";
import { babyDisplayName } from "@/lib/babycam/wristband";
import { Toast, useToast } from "@/components/ui/Toast";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
// 按鈕樣式一律取自 components/ui/Button，不在此另開複本（見該檔開頭說明）。
const button = buttonStyles();
/* 換鏡頭的常見情境（客戶 2026-10-29）：寶寶感冒移到隔離房、好了推回原位、
   原鏡頭故障。選單化而不是自由輸入，現場才不會每個人寫法不同。 */
const CHANGE_REASONS = ["移至隔離房", "隔離結束歸位", "原監視器故障", "房間消毒", "其他"];

/*
  胎別（客戶兩次回饋後的定案，2026-10-30）。

  第一版是「胎序（單胞胎 0）」的數字框——要先知道 0 代表單胞胎才填得對。
  第二版改成胎別按鈕，但「選了雙胞胎」只改這一位的編號，第二位還得自己再新增一次，
  客戶的反應是「我選了雙胞胎，標籤預覽怎麼還是只有一位」。

  這一版照字面做：**選雙胞胎就一次登錄兩位**。胎別決定表單上有幾組欄位，
  胎序（1、2、3…）由位置自動給，護理人員完全不必碰那個編號。
  單胞胎 → 一組、胎序 0（標籤不加字母）；雙胞胎 → 兩組 A／B；多胞胎 → 自選 3～6 組。
*/
const BIRTH_KINDS = ["單胞胎", "雙胞胎", "多胞胎"] as const;
type BirthKind = (typeof BIRTH_KINDS)[number];

type Draft = {
  /** 已存在的寶寶會帶 id，新的留空由 assign 產生。 */
  babyId: string;
  name: string;
  sex: "男" | "女";
  cartNo: string;
  cameraId: string;
  /** 使用者是否動過姓名；沒動過就跟著媽媽、性別與胎序自動帶。 */
  renamed: boolean;
};

export default function BindingEditor({ data, binding, onChange }: { data: DemoDomain; binding: ViewingBinding; onChange: () => void }) {
  const candidates = data.subjects.filter((subject) => subject.caseId === binding.caseId && subject.kind === "baby");

  /** 還沒被任何寶寶占用的監視器；新增一組欄位時用它給預設，避免一開啟就撞號。 */
  function freeCameras(exclude: string[]) {
    return data.cameras.filter(
      (camera) =>
        camera.enabled &&
        !exclude.includes(camera.id) &&
        !data.bindings.some((item) => !item.ended && item.babies.some((baby) => baby.cameraId === camera.id)),
    );
  }

  /** 依胎序產生一組空白欄位；性別先男後女輪著給，現場再改。 */
  function blankDraft(order: number, taken: string[]): Draft {
    const sex: "男" | "女" = order % 2 === 0 ? "女" : "男";
    return {
      babyId: "",
      name: babyDisplayName(binding.motherName, sex, order) || DEMO_BABY_NAME,
      sex,
      cartNo: "",
      cameraId: freeCameras(taken)[0]?.id ?? data.cameras[0]?.id ?? "",
      renamed: false,
    };
  }

  /** 這筆入住已登錄的寶寶，依胎序排好當成初始欄位。 */
  function existingDrafts(): Draft[] {
    return binding.babies
      .slice()
      .sort((a, b) => (a.birthOrder ?? 0) - (b.birthOrder ?? 0))
      .map((baby) => {
        const subject = candidates.find((item) => item.id === baby.babyId);
        const sex: "男" | "女" = subject?.gender === "女" ? "女" : "男";
        const name = orDemo(subject?.name, DEMO_BABY_NAME);
        return {
          babyId: baby.babyId,
          name,
          sex,
          cartNo: baby.cartNo,
          cameraId: baby.cameraId,
          /* 名字還是規則產生的就當成「沒改過」，切胎別時要跟著補上 A／B——
             否則單胞胎改成雙胞胎時，第一位還是「○○○之子」、第二位卻有 B，兩張標籤對不起來。
             護理人員自己打過的名字（和規則不同）才保留。 */
          renamed: name !== babyDisplayName(binding.motherName, sex, baby.birthOrder ?? 0),
        };
      });
  }

  const initial = binding.babies.length ? existingDrafts() : [blankDraft(0, [])];
  const [drafts, setDrafts] = useState<Draft[]>(initial);
  const [birthKind, setBirthKind] = useState<BirthKind>(initial.length >= 3 ? "多胞胎" : initial.length === 2 ? "雙胞胎" : "單胞胎");
  const [birthDate, setBirthDate] = useState(() => candidates.find((item) => item.birthDate)?.birthDate ?? "2026-10-01");
  const [zone, setZone] = useState("全部");
  const [reason, setReason] = useState(CHANGE_REASONS[0]);
  const [confirmRemove, setConfirmRemove] = useState("");
  const [toast, toastProps] = useToast();

  /** 多胞胎時每一位的胎序＝位置＋1；單胞胎固定 0（標籤不加字母）。 */
  const orderOf = (index: number) => (drafts.length > 1 ? index + 1 : 0);
  const changedCamera = drafts.some((draft) => {
    const original = binding.babies.find((baby) => baby.babyId === draft.babyId);
    return original && original.cameraId !== draft.cameraId;
  });

  function patch(index: number, next: Partial<Draft>) {
    setDrafts((current) =>
      current.map((draft, position) => {
        if (position !== index) return draft;
        const merged = { ...draft, ...next };
        // 姓名沒被手動改過就跟著性別與胎序走，雙胞胎才有 A／B。
        if (!merged.renamed && next.name === undefined) merged.name = babyDisplayName(binding.motherName, merged.sex, current.length > 1 ? index + 1 : 0);
        return merged;
      }),
    );
  }

  /** 換胎別＝改變要登錄幾位。已登錄的那幾位不動，只增減空白欄位與姓名上的字母。 */
  function pickKind(next: BirthKind, size = next === "單胞胎" ? 1 : next === "雙胞胎" ? 2 : Math.max(3, drafts.length)) {
    setBirthKind(next);
    setDrafts((current) => {
      const kept = size <= current.length ? current.slice(0, size) : [...current];
      while (kept.length < size) kept.push(blankDraft(kept.length + 1, kept.map((item) => item.cameraId)));
      return kept.map((draft, index) => (draft.renamed ? draft : { ...draft, name: babyDisplayName(binding.motherName, draft.sex, size > 1 ? index + 1 : 0) }));
    });
  }

  function save() {
    const done: string[] = [];
    try {
      drafts.forEach((draft, index) => {
        babycamActions.assign(binding.id, {
          babyId: draft.babyId || undefined,
          name: draft.name,
          cartNo: draft.cartNo,
          birthDate,
          sex: draft.sex,
          birthOrder: orderOf(index),
          cameraId: draft.cameraId,
          reason,
        });
        done.push(draft.name);
      });
      toast.ok(`已登錄 ${done.length} 位寶寶；照護頁、標籤與觀看端同步更新。`);
      onChange();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "登錄失敗。";
      /* 多胞胎是一位一位寫進去的，中途失敗要講清楚前面幾位已經存了，
         否則護理人員會整組重按，第一位就會跳「車號已被使用」。 */
      toast.fail(done.length ? `已登錄 ${done.join("、")}；第 ${done.length + 1} 位未完成：${detail}` : detail);
      if (done.length) onChange();
    }
  }

  function remove(babyId: string) {
    try {
      babycamActions.unassign(binding.id, babyId);
      setDrafts((current) => current.filter((draft) => draft.babyId !== babyId));
      setConfirmRemove("");
      toast.ok("已解除，照護紀錄保留，舊標籤失效。");
      onChange();
    } catch (error) {
      toast.fail(error instanceof Error ? error.message : "解除失敗。");
    }
  }

  /* 已被「別筆入住」占用的監視器；晶片上標成虛線「已指派」而不是消失，
     現場才看得出來「那支不是壞了，是別人在用」。本表單內各位之間的互斥另外算。 */
  const takenByOthers = data.bindings
    .filter((item) => !item.ended)
    .flatMap((item) => item.babies)
    .filter((baby) => !drafts.some((draft) => draft.babyId === baby.babyId))
    .map((baby) => baby.cameraId);
  const zoneCameras = data.cameras.filter((camera) => camera.enabled && (zone === "全部" || camera.code.startsWith(zone)));
  const history = data.cameraIntervals.filter((item) => drafts.some((draft) => draft.babyId === item.babyId)).slice().reverse();

  return <section className="space-y-5 rounded-xl border border-stone-200 bg-white p-4">
    <Toast {...toastProps} />
    <h2 className="font-semibold">登錄寶寶、車號與監視器</h2>

    <fieldset className="space-y-2 border-0 p-0">
      <legend className="pb-2 text-sm font-semibold text-stone-700">這一胎</legend>
      <div className="flex flex-wrap items-center gap-2">
        {BIRTH_KINDS.map((item) => (
          <button key={item} type="button" aria-pressed={birthKind === item} className={buttonStyles({ selected: birthKind === item })} onClick={() => pickKind(item)}>{item}</button>
        ))}
        {birthKind === "多胞胎" && (
          <label className="flex items-center gap-2 border-l border-stone-200 pl-3 text-sm text-stone-600">
            共
            <select aria-label="多胞胎人數" className="min-h-12 w-20 rounded-lg border border-stone-300 bg-white px-2 text-sm" value={drafts.length} onChange={(event) => pickKind("多胞胎", Number(event.target.value))}>
              {[3, 4, 5, 6].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            位
          </label>
        )}
        <span className="ml-auto text-xs text-stone-500">選了幾位就填幾組；胎序與標籤上的 A、B、C 由系統給。</span>
      </div>
    </fieldset>

    <div className="flex flex-wrap items-end gap-3">
      <label className="block max-w-xs flex-1 text-sm">出生日期（同一胎共用）<input aria-label="出生日期" type="date" className={input} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
      <ZoneFilter zones={["全部", "A", "B"]} active={zone} onSelect={setZone} />
    </div>

    {drafts.map((draft, index) => (
      <fieldset key={index} className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
        <legend className="px-1 text-sm font-semibold text-stone-700">
          {drafts.length > 1 ? `第 ${index + 1} 位（標籤印 ${String.fromCharCode(65 + index)}）` : "寶寶資料"}
          {draft.babyId && <span className="ml-2 text-xs font-normal text-stone-500">已登錄</span>}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">寶寶姓名<input aria-label={`第 ${index + 1} 位寶寶姓名`} className={input} value={draft.name} onChange={(event) => patch(index, { name: event.target.value, renamed: true })} /></label>
          <label className="text-sm">車號<input aria-label={`第 ${index + 1} 位車號`} className={input} value={draft.cartNo} onChange={(event) => patch(index, { cartNo: event.target.value })} /></label>
          <label className="text-sm">性別<select aria-label={`第 ${index + 1} 位性別`} className={input} value={draft.sex} onChange={(event) => patch(index, { sex: event.target.value as "男" | "女" })}><option>男</option><option>女</option></select></label>
          <p className="self-end text-xs text-stone-500">監視器：{data.cameras.find((camera) => camera.id === draft.cameraId)?.code ?? "尚未選擇"}</p>
        </div>
        {/* 監視器用晶片挑，不用下拉選單——33 支塞進 select 一次只看得到幾支，
            護理人員在現場要做的事只是「挑一支」。與 BabyCam 的 camera-chip-grid 對齊。 */}
        <CameraChipGrid
          cameras={zoneCameras}
          selectedIds={[draft.cameraId]}
          takenIds={[...takenByOthers, ...drafts.filter((_, position) => position !== index).map((item) => item.cameraId)]}
          onToggle={(id) => patch(index, { cameraId: id })}
        />
        {draft.babyId && <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => setConfirmRemove(draft.babyId)}>解除這一位的指派</button>}
        {/* 要先有 babyId 才比對：還沒登錄的那幾位 babyId 是空字串，會跟初始值撞在一起，
            選雙胞胎時第二組就會莫名其妙跳出解除確認框。 */}
        {draft.babyId && confirmRemove === draft.babyId && (
          <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
            <p>確認解除 {draft.name} 的監視器與車號？原照護紀錄保留，舊識別標籤失效；重新登錄後須重印標籤。</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={() => remove(draft.babyId)}>確認解除</button>
              <button type="button" className={button} onClick={() => setConfirmRemove("")}>保留原指派</button>
            </div>
          </div>
        )}
      </fieldset>
    ))}

    <div className="flex flex-wrap items-center gap-3">
      {changedCamera && <label className="flex items-center gap-2 text-sm">更換原因<select aria-label="更換原因" className="min-h-12 rounded-lg border border-stone-300 bg-white px-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value)}>{CHANGE_REASONS.map((item) => <option key={item}>{item}</option>)}</select></label>}
      <button type="button" className={buttonStyles({ variant: "primary", className: "ml-auto" })} onClick={save}>
        {binding.babies.length ? `儲存這 ${drafts.length} 位的資料` : `登錄這 ${drafts.length} 位寶寶`}
      </button>
    </div>

    {/* 換鏡頭歷程直接讀 cameraIntervals——換一次就封一段、開一段，不另外存一張表。 */}
    {history.length > 0 && <div className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-700">監視器歷程</h3>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-stone-50"><tr>{["寶寶", "監視器", "開始", "結束", "原因"].map((label) => <th key={label} className="whitespace-nowrap p-2 font-medium">{label}</th>)}</tr></thead><tbody>
        {history.map((item) => <tr key={item.id} className="border-t border-stone-200">
          <td className="p-2">{candidates.find((subject) => subject.id === item.babyId)?.name ?? "—"}</td>
          <td className="p-2">{data.cameras.find((camera) => camera.id === item.cameraId)?.code ?? item.cameraId}</td>
          <td className="p-2">{item.start}</td>
          <td className="p-2">{item.end ?? "使用中"}</td>
          <td className="p-2">{item.reason ?? "—"}</td>
        </tr>)}
      </tbody></table></div>
    </div>}
  </section>;
}
