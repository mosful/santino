"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { babycamActions } from "@/lib/babycam/actions";
import type { DemoDomain } from "@/lib/domain/types";
import { viewingSettingsOf } from "@/lib/babycam/viewingSettings";

/*
  04 後臺管理 ─ 開放時段與房間清單。

  版面對齊 BabyCam 的 `admin/SettingsPanel.tsx`：
  - 開放時段：三列時間與觀看人數集中儲存，少用的開關收進進階設定。
  - 房間清單：樓層／房型／房號三個篩選＋清除、顯示 N／M 間、房型色彩圖例，
    再依樓層分組成房號卡片，每張卡直接改房型。

  ⚠️ 時段是**一組**設定：時段只決定環狀燈要不要揭露有人在看；是否同時擋住實際
  畫面，由同一張卡裡的「時段外擋住畫面」決定。拆成兩處維護會設出互相矛盾的值。
*/

const input = "h-10 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm";

const SCHEDULE_ROWS = [
  { key: "houseWindow", title: "全院開放觀看時間" },
  { key: "internalWindow", title: "院內開放時段" },
  { key: "familyWindow", title: "親友開放時段" },
] as const;

export function SchedulePanel({ data, run }: { data: DemoDomain; run: (action: () => void, feedback?: string) => void }) {
  const [draft, setDraft] = useState(() => viewingSettingsOf(data));
  const dirty = JSON.stringify(draft) !== JSON.stringify(viewingSettingsOf(data));

  return (
    <form aria-label="開放時段設定" className="@container space-y-5" onSubmit={(event) => {
      event.preventDefault();
      run(() => babycamActions.settings(draft), "開放時段與觀看人數已儲存。");
    }}>
      <div className="divide-y divide-border-subtle">
        {SCHEDULE_ROWS.map(({ key, title }) => (
          <section key={key} aria-label={title} className="grid min-w-0 gap-3 py-5 first:pt-0 @min-[640px]:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)] @min-[640px]:items-center">
            <h3 className="text-base font-semibold text-stone-800">{title}</h3>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
              <label className="min-w-0 space-y-2 text-sm text-stone-600">
                開始時間
                <input aria-label={`${title}開始`} type="time" required className="min-h-12 w-full min-w-0 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base" value={draft[key].start} onChange={(event) => setDraft({ ...draft, [key]: { ...draft[key], start: event.target.value } })} />
              </label>
              <span aria-hidden="true" className="self-end pb-3 text-stone-500">至</span>
              <label className="min-w-0 space-y-2 text-sm text-stone-600">
                結束時間
                <input aria-label={`${title}結束`} type="time" required className="min-h-12 w-full min-w-0 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base" value={draft[key].end} onChange={(event) => setDraft({ ...draft, [key]: { ...draft[key], end: event.target.value } })} />
              </label>
            </div>
          </section>
        ))}
        <section aria-label="親友同時觀看" className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <h3 className="text-base font-semibold text-stone-800">親友同時觀看</h3>
            <p className="mt-1 text-sm text-stone-600">每筆入住共用名額，含多胞胎。</p>
          </div>
          <label className="flex items-center gap-3 text-base text-stone-700">
            <span className="sr-only">同時觀看上限（位）</span>
            <input aria-label="同時觀看上限（位）" type="number" required min={0} max={10} step={1} className="min-h-12 w-24 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-center text-base" value={draft.familyLimit} onChange={(event) => setDraft({ ...draft, familyLimit: Number(event.target.value) })} />
            位
          </label>
        </section>
      </div>

      <details className="border-t border-border-subtle pt-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-stone-700">進階設定</summary>
        <div className="mt-2 space-y-2">
          {([
            ["enforceInternal", "院內時段外暫停觀看"],
            ["enforceFamily", "親友時段外暫停觀看"],
            ["concurrencyEnforced", "超過觀看人數上限時暫停新登入"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 text-sm text-stone-700">
              <input type="checkbox" checked={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })} className="h-5 min-h-0 w-5 shrink-0" />
              {label}
            </label>
          ))}
          <p className="text-sm leading-6 text-stone-600">取消時段外暫停時，時間僅影響觀看燈號；人數填 0 或取消上限開關則不限制人數。</p>
        </div>
      </details>

      <p className="text-sm leading-6 text-stone-600">院內與親友時段受全院時間限制；消毒與照護遮蔽仍會優先套用。</p>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <p aria-live="polite" className="text-sm text-stone-600">{dirty ? "尚有未儲存的變更" : "設定已儲存"}</p>
        <Button type="submit" size="lg" variant="primary" disabled={!dirty}>儲存設定</Button>
      </div>
    </form>
  );
}

/* ───────────────────────── 房間清單 ───────────────────────── */

const TONE: Record<string, string> = {
  VILLA: "border-violet-300 bg-violet-50 text-violet-800",
  VIP: "border-amber-300 bg-amber-50 text-amber-800",
  精緻: "border-emerald-300 bg-emerald-50 text-emerald-800",
};
const toneOf = (priceCategory: string) => TONE[priceCategory] ?? "border-border-subtle bg-surface-muted text-stone-600";
const floorOf = (room: string) => (room.length > 2 ? room.slice(0, -2) : "其他");

export function RoomListPanel({ data, run }: { data: DemoDomain; run: (action: () => void, feedback?: string) => void }) {
  const [floor, setFloor] = useState("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [newRoom, setNewRoom] = useState("");
  const [newType, setNewType] = useState(data.roomTypes[0]?.id ?? "精緻");
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypePrice, setNewTypePrice] = useState<"精緻" | "VIP" | "VILLA">("精緻");

  const floors = [...new Set(data.rooms.map((room) => floorOf(room.room)))].sort((a, b) =>
    a.localeCompare(b, "zh-TW", { numeric: true }),
  );
  const visible = data.rooms
    .filter(
      (room) =>
        (floor === "all" || floorOf(room.room) === floor) &&
        (type === "all" || (room.typeId || room.roomType) === type) &&
        room.room.includes(query.trim()),
    )
    .sort((a, b) => a.room.localeCompare(b.room, "zh-TW", { numeric: true }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface-muted/50 p-3">
        <label className="space-y-1 text-xs text-stone-500">
          樓層
          <select aria-label="樓層" className={input} value={floor} onChange={(event) => setFloor(event.target.value)}>
            <option value="all">全部樓層</option>
            {floors.map((item) => (
              <option key={item} value={item}>
                {item === "其他" ? item : `${item} 樓`}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-stone-500">
          房型
          <select aria-label="房型篩選" className={input} value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">全部房型</option>
            {data.roomTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-stone-500">
          搜尋房號
          <input
            aria-label="搜尋房號"
            type="search"
            className={input}
            placeholder="例如 201、60…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Button
          size="sm"
          onClick={() => {
            setFloor("all");
            setType("all");
            setQuery("");
          }}
        >
          清除篩選
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span role="status" className="text-sm font-semibold text-stone-700">
          顯示 {visible.length} / {data.rooms.length} 間房
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-1.5" aria-label="房型色彩圖例">
          {data.roomTypes.map((item) => (
            <span key={item.id} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneOf(item.priceCategory)}`}>
              {item.name}
            </span>
          ))}
          <Button size="sm" selected={typeOpen} onClick={() => setTypeOpen(!typeOpen)}>
            維護房型
          </Button>
        </span>
      </div>

      {typeOpen && (
        <section className="space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
          <div>
            <h4 className="text-sm font-bold text-stone-800">房間類型</h4>
            <p className="mt-0.5 text-xs leading-5 text-stone-500">
              預設 VILLA、VIP、精緻，可自行新增或改名；修改後會同步更新房間清單與入住選單。
              <strong>計價基準不隨名稱改變</strong>，已簽合約的價格不受影響。仍被房號使用的房型不可刪除。
            </p>
          </div>
          {data.roomTypes.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-2">
              <input
                aria-label={`${item.name} 房型名稱`}
                className={`${input} sm:w-48`}
                defaultValue={item.name}
                onBlur={(event) => {
                  if (event.target.value !== item.name) run(() => babycamActions.roomType(item.id, event.target.value, item.priceCategory));
                }}
              />
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneOf(item.priceCategory)}`}>
                計價基準 {item.priceCategory}
              </span>
              <Button size="sm" variant="danger" onClick={() => run(() => babycamActions.roomType(item.id, item.name, item.priceCategory, true))}>
                刪除
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-2 border-t border-border-subtle pt-3">
            <input
              aria-label="新增房型名稱"
              className={`${input} sm:w-48`}
              placeholder="新房型名稱…"
              value={newTypeName}
              onChange={(event) => setNewTypeName(event.target.value)}
            />
            <select
              aria-label="新房型計價基準"
              className={`${input} sm:w-36`}
              value={newTypePrice}
              onChange={(event) => setNewTypePrice(event.target.value as typeof newTypePrice)}
            >
              {["精緻", "VIP", "VILLA"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                run(() => {
                  babycamActions.roomType("", newTypeName, newTypePrice);
                  setNewTypeName("");
                }, "已新增房型。")
              }
            >
              新增房型
            </Button>
          </div>
        </section>
      )}

      {floors.map((item) => {
        const rooms = visible.filter((room) => floorOf(room.room) === item);
        if (!rooms.length) return null;
        return (
          <section key={item} aria-label={`${item} 樓房間`}>
            <h4 className="mb-2 flex items-baseline gap-2 text-sm font-bold text-stone-800">
              {item === "其他" ? "其他樓層" : `${item} 樓`}
              <span className="text-xs font-normal text-stone-500">{rooms.length} 間</span>
            </h4>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
              {rooms.map((room) => (
                <div
                  key={room.room}
                  className={`space-y-2 rounded-xl border p-2.5 ${toneOf(room.roomType)} ${room.enabled ? "" : "opacity-55"}`}
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <strong className="text-base font-bold tabular-nums">{room.room}</strong>
                    {!room.enabled && <span className="text-[10px] font-semibold">停用</span>}
                  </div>
                  <select
                    aria-label={`${room.room} 房型`}
                    className="h-9 w-full rounded-lg border border-black/10 bg-white/85 px-2 text-xs text-stone-800"
                    value={room.typeId || room.roomType}
                    onChange={(event) =>
                      run(() => {
                        const picked = data.roomTypes.find((candidate) => candidate.id === event.target.value);
                        babycamActions.room(room.room, picked?.priceCategory ?? room.roomType, room.enabled, event.target.value);
                      }, `${room.room} 的房型已更新。`)
                    }
                  >
                    {data.roomTypes.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {!visible.length && (
        <p className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-stone-500">
          沒有符合條件的房間，請調整或清除篩選。
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border-subtle bg-surface-muted/50 p-3">
        <label className="space-y-1 text-xs text-stone-500">
          新增房號
          <input
            aria-label="新增房號"
            className={`${input} sm:w-36`}
            placeholder="3～4 位數"
            value={newRoom}
            onChange={(event) => setNewRoom(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs text-stone-500">
          房型
          <select aria-label="新房號房型" className={`${input} sm:w-36`} value={newType} onChange={(event) => setNewType(event.target.value)}>
            {data.roomTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            run(() => {
              const picked = data.roomTypes.find((item) => item.id === newType);
              babycamActions.room(newRoom.trim(), picked?.priceCategory ?? "精緻", true, newType);
              setNewRoom("");
            }, "房號已新增並啟用，入住房號下拉同步出現。")
          }
        >
          新增房號
        </Button>
        <p className="w-full text-xs text-stone-500">
          房號主檔與院務端共用同一份（共 {data.rooms.length} 間，2／3／5／6 樓跳過 04）。使用中的房號不可停用。
        </p>
      </div>
    </div>
  );
}
