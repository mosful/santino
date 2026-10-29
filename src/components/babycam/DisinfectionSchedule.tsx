"use client";

import { useState } from "react";
import { babycamActions } from "@/lib/babycam/actions";
import { activeDisinfection, describeDisinfection, type Disinfection } from "@/lib/babycam/disinfection";
import type { DemoDomain } from "@/lib/domain/types";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { SectionHeading } from "./BabycamUi";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
const button = buttonStyles();
const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

type Draft = Omit<Disinfection, "id"> & { id?: string };

const BLANK: Draft = { label: "環境消毒", kind: "環境", weekday: null, date: "", start: "09:00", end: "12:00", rooms: [], enabled: true };

/**
 * 消毒排程（客戶 2026-10-29）。
 *
 * 院內固定每週二 09:00–12:00 做紫外線消毒，另有不定期的環境消毒。排程到點時，
 * 指定房間（空＝全院）的監視器一律關閉：媽媽端與親友端擋下、環狀燈熄滅、
 * 繼電器通道全關。判定只有一支 `activeDisinfection`，三個地方共用。
 *
 * ⚠️ 本專案是靜態原型，關的是畫面上的模擬狀態，不會連線任何實體設備。
 */
export default function DisinfectionSchedule({ data, onChange }: { data: DemoDomain; onChange: () => void }) {
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [roomText, setRoomText] = useState("");
  const [message, setMessage] = useState("");
  const items = data.disinfections ?? [];

  function patch(next: Partial<Draft>) { setDraft((current) => ({ ...current, ...next })); }

  function edit(item: Disinfection) {
    setDraft({ ...item });
    setRoomText(item.rooms.join("、"));
    setMessage("");
  }

  function save() {
    try {
      // 房號用頓號或逗號分隔都收，現場不會記得該用哪一種。
      const rooms = roomText.split(/[、,，\s]+/).map((item) => item.trim()).filter(Boolean);
      babycamActions.saveDisinfection({ ...draft, rooms });
      setDraft(BLANK); setRoomText(""); setMessage("消毒排程已儲存。"); onChange();
    } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); }
  }

  function remove(item: Disinfection) {
    try { babycamActions.removeDisinfection(item.id); setMessage(`已刪除「${item.label}」。`); onChange(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "刪除失敗。"); }
  }

  // 橫幅要涵蓋「只套某幾間房」的排程，不能只看全院——305 在消毒時畫面上該說得出來。
  const running = items.filter((item) => activeDisinfection(data, item.rooms[0] ?? "")?.id === item.id);
  return (
    <div className="space-y-4 p-4 sm:p-5">
      <SectionHeading no={1} title="消毒排程" description="排程到點時指定房間的監視器一律關閉；觀看端會顯示消毒中，環狀燈熄滅、繼電器通道全關。" />
      {running.length > 0 && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        消毒進行中，監視器暫停：{running.map((item) => `${item.label}（${item.start}–${item.end}，${item.rooms.length ? item.rooms.join("、") : "全院"}）`).join("；")}
      </p>}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-stone-50"><tr>{["項目", "方式", "排程", "狀態", ""].map((label) => <th key={label} className="whitespace-nowrap p-3 font-medium">{label}</th>)}</tr></thead>
          <tbody>
            {items.map((item) => {
              const running = activeDisinfection(data, item.rooms[0] ?? "")?.id === item.id;
              return <tr key={item.id} className="border-t border-stone-200">
                <td className="p-3 font-medium">{item.label}</td>
                <td className="p-3">{item.kind}</td>
                <td className="p-3">{describeDisinfection(item)}</td>
                <td className="p-3">{!item.enabled ? <span className="text-stone-400">已停用</span> : running ? <span className="font-semibold text-amber-700">進行中</span> : "待執行"}</td>
                <td className="p-3"><div className="flex flex-wrap gap-2">
                  <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => edit(item)}>編輯</button>
                  <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { babycamActions.saveDisinfection({ ...item, enabled: !item.enabled }); onChange(); }}>{item.enabled ? "停用" : "啟用"}</button>
                  <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => remove(item)}>刪除</button>
                </div></td>
              </tr>;
            })}
          </tbody>
        </table>
        {!items.length && <p className="p-6 text-sm text-stone-500">尚未設定消毒排程。</p>}
      </div>

      <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="font-semibold">{draft.id ? `編輯「${draft.label}」` : "新增消毒排程"}</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm">項目名稱<input aria-label="消毒項目名稱" className={input} value={draft.label} onChange={(event) => patch({ label: event.target.value })} /></label>
          <label className="text-sm">消毒方式<select aria-label="消毒方式" className={input} value={draft.kind} onChange={(event) => patch({ kind: event.target.value as Disinfection["kind"] })}><option>紫外線</option><option>環境</option></select></label>
          <label className="text-sm">週期<select aria-label="消毒週期" className={input} value={draft.weekday === null ? "once" : String(draft.weekday)} onChange={(event) => patch(event.target.value === "once" ? { weekday: null } : { weekday: Number(event.target.value), date: "" })}>
            <option value="once">不定期（指定日期）</option>
            {WEEKDAYS.map((label, index) => <option key={label} value={index}>每{label}</option>)}
          </select></label>
          {draft.weekday === null && <label className="text-sm">消毒日期<input aria-label="消毒日期" type="date" className={input} value={draft.date} onChange={(event) => patch({ date: event.target.value })} /></label>}
          <label className="text-sm">開始時間<input aria-label="消毒開始時間" type="time" className={input} value={draft.start} onChange={(event) => patch({ start: event.target.value })} /></label>
          <label className="text-sm">結束時間<input aria-label="消毒結束時間" type="time" className={input} value={draft.end} onChange={(event) => patch({ end: event.target.value })} /></label>
          <label className="text-sm xl:col-span-2">適用房號（留空＝全院）<input aria-label="適用房號" className={input} value={roomText} placeholder="例：305、306" onChange={(event) => setRoomText(event.target.value)} /></label>
          <label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" checked={draft.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />啟用此排程</label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={buttonStyles({ variant: "primary" })} onClick={save}>{draft.id ? "儲存修改" : "新增排程"}</button>
          {draft.id && <button type="button" className={button} onClick={() => { setDraft(BLANK); setRoomText(""); }}>取消編輯</button>}
        </div>
        {message && <p role="status" className="rounded-lg bg-stone-50 p-3 text-sm">{message}</p>}
      </section>
    </div>
  );
}
