"use client";

import type { ReactNode } from "react";
import { Bed, Settings2, SlidersHorizontal, Tags } from "lucide-react";
import type { CameraRecord } from "@/lib/domain/types";

/*
  寶寶視訊工作區的版面語彙，刻意對齊 BabyCam 專案（C:\\Code\\BabyCam）的管理端
  `/admin`，讓同一組院內人員在兩套系統間不用重新學版面：

  - `Panel`          ← BabyCam 的 `.panel` ＋ `.panel-title`：圓形編號徽章＋標題＋一行說明。
  - `SectionHeading` ← BabyCam 的 `.form-section-heading`：卡片內的小節編號。
  - `SplitWorkspace` ← BabyCam 的 `.admission-workspace`：左表單、右交付／預覽欄，
                       右欄自帶底色與左分隔線並貼齊卡片邊緣。
  - `CameraChipGrid` ← BabyCam 的 `.camera-chip-grid`：33 支監視器用晶片挑，不是
                       下拉選單，也不是「一支一列、兩個停用輸入框」的長清單。
  - `AreaTabs`       ← BabyCam 的 `.admission-area-tabs`：卡片內的底線式頁籤。

  差異之處只有一個，且是刻意的：BabyCam 的四個功能群組放在左側 244px 側欄，
  但聖帝諾院務系統本身已經有一條全域模組側欄，再疊一條會變成兩層導覽，
  因此功能群組改成橫向的圖示分段列（`GroupNav`），群組內的頁籤維持底線式。
*/

export const GROUP_ICONS = { "01": Bed, "02": Tags, "04": SlidersHorizontal, "08": Settings2 } as const;

/** BabyCam 的 `.panel` ＋ `.panel-title`：編號徽章、標題、一行說明。 */
export function Panel({
  no,
  title,
  description,
  action,
  flush = false,
  children,
}: {
  no?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** true 代表內容要貼齊卡片邊緣（左右兩欄版面用），卡片本身不給內距。 */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={
        "overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised shadow-xs " +
        (flush ? "" : "p-4 sm:p-5")
      }
    >
      <div className={"flex items-start gap-3 " + (flush ? "p-4 pb-0 sm:p-5 sm:pb-0" : "mb-4")}>
        {no && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold tabular-nums text-white">
            {no}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-stone-800">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** BabyCam 的 `.form-section-heading`：卡片內的小節編號＋說明。 */
export function SectionHeading({ no, title, description }: { no: string | number; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold tabular-nums text-brand-700">
        {no}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-stone-800">{title}</h3>
        {description && <p className="mt-0.5 text-xs leading-5 text-stone-500">{description}</p>}
      </div>
    </div>
  );
}

/**
 * BabyCam 的 `.admission-workspace`：左邊作業表單，右邊交付／預覽。
 *
 * ⚠️ 右欄要「填滿整欄高度」而不是 sticky——BabyCam 走過這條路：sticky 與填滿互斥，
 * 而寫死 min-height 會在空狀態留一截白框。這裡用 grid 讓兩欄自然等高。
 */
export function SplitWorkspace({ form, aside }: { form: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid border-t border-border-subtle lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
      <div className="min-w-0 p-4 sm:p-5">{form}</div>
      <aside className="min-w-0 border-t border-border-subtle bg-surface-muted/60 p-4 sm:p-5 lg:border-l lg:border-t-0">
        {aside}
      </aside>
    </div>
  );
}

/** 右欄交付區的標頭（BabyCam 的 `.delivery-header`）。 */
export function AsideHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-4">
      <span className="text-[11px] font-extrabold tracking-[0.18em] text-brand-600">{eyebrow}</span>
      <h3 className="mt-1 text-sm font-bold text-stone-800">{title}</h3>
      {description && <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>}
    </div>
  );
}

/** 右欄的空狀態（BabyCam 的 `.delivery-empty`）。 */
export function AsideEmpty({ mark, title, description }: { mark: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-subtle bg-surface-raised/70 p-8 text-center">
      <span aria-hidden="true" className="text-xl font-extrabold tracking-wide text-stone-300">
        {mark}
      </span>
      <h4 className="text-sm font-bold text-stone-700">{title}</h4>
      <p className="text-xs leading-5 text-stone-500">{description}</p>
    </div>
  );
}

/** BabyCam 的 `.admission-area-tabs`：卡片內底線式頁籤。 */
export function AreaTabs<T extends string>({
  tabs,
  active,
  onSelect,
  label,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
  label: string;
}) {
  if (tabs.length <= 1) return null;
  return (
    <div role="group" aria-label={label} className="scroll-fade mx-4 flex gap-1 overflow-x-auto border-b border-border-subtle pt-4 sm:mx-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={active === tab.id}
          onClick={() => onSelect(tab.id)}
          className={
            // 高度寫死：選取態只換顏色不換邊框寬度，不然選中的那顆會比旁邊高 1px。
            "-mb-px flex h-11 shrink-0 items-center rounded-t-lg border border-b-2 border-transparent px-4 text-sm transition-colors " +
            (active === tab.id
              ? "border-x-border-subtle border-t-border-subtle border-b-brand-600 bg-brand-50 font-bold text-brand-700"
              : "font-medium text-stone-500 hover:bg-surface-muted hover:text-brand-700")
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** 功能群組導覽：BabyCam 側欄的橫向版（見檔頭說明）。 */
export function GroupNav<T extends string>({
  groups,
  active,
  onSelect,
}: {
  groups: { id: T; label: string; icon: React.ComponentType<{ className?: string }> }[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <nav
      aria-label="寶寶視訊功能"
      className="scroll-fade flex gap-1 overflow-x-auto rounded-2xl border border-border-subtle bg-surface-raised p-1.5 shadow-xs"
    >
      {groups.map((group) => {
        const Icon = group.icon;
        const on = active === group.id;
        return (
          <button
            key={group.id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(group.id)}
            className={
              "flex h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition-colors " +
              (on ? "bg-brand-600 text-white shadow-sm" : "text-stone-500 hover:bg-brand-50 hover:text-brand-700")
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="tabular-nums opacity-70">{group.id}</span>
            {group.label}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * BabyCam 的 `.camera-chip-grid`：挑選階段只顯示代碼，欄位等選完才出現。
 *
 * ⚠️ 不要退回下拉選單或「一支一列」的清單：33 支監視器放進 420px 捲動區時
 * 一次只看得到 7 支，護理人員要做的事只是「挑一支」。
 */
export function CameraChipGrid({
  cameras,
  selectedIds,
  takenIds,
  onToggle,
  emptyText = "此分區沒有可用的監視器。",
}: {
  cameras: CameraRecord[];
  selectedIds: string[];
  takenIds?: string[];
  onToggle: (cameraId: string, next: boolean) => void;
  emptyText?: string;
}) {
  return (
    <div className="scroll-fade grid max-h-[340px] grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2 overflow-auto rounded-xl border border-border-subtle bg-surface-raised p-3">
      {cameras.map((camera) => {
        const checked = selectedIds.includes(camera.id);
        const taken = !checked && (takenIds?.includes(camera.id) ?? false);
        return (
          <label
            key={camera.id}
            className={
              "relative flex min-h-[46px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-1.5 text-center transition-colors " +
              (checked
                ? "border-brand-600 bg-brand-600 text-white"
                : taken
                  ? "cursor-not-allowed border-dashed border-border-subtle bg-surface-muted text-stone-400"
                  : "border-border-subtle bg-surface-raised hover:border-brand-300 hover:bg-brand-50")
            }
          >
            {/* checkbox 鋪滿整顆晶片：保留複選語意與鍵盤操作，又不會被上層文字擋住點擊 */}
            <input
              type="checkbox"
              className="absolute inset-0 m-0 h-full w-full min-h-0 cursor-inherit p-0 opacity-0"
              checked={checked}
              disabled={taken}
              aria-label={`監視器 ${camera.code}${taken ? "（已指派）" : ""}`}
              onChange={(event) => onToggle(camera.id, event.target.checked)}
            />
            <strong className="text-sm font-bold tabular-nums">{camera.code}</strong>
            <em
              className={
                "text-[10px] font-bold not-italic " + (checked ? "text-white/75" : taken ? "text-stone-400" : "text-stone-500")
              }
            >
              {taken ? "已指派" : camera.enabled ? camera.health : "停用"}
            </em>
          </label>
        );
      })}
      {!cameras.length && <p className="col-span-full py-3 text-center text-sm text-stone-500">{emptyText}</p>}
    </div>
  );
}

/** 監視器分區篩選（BabyCam 的 `.camera-zone-filter`）。 */
export function ZoneFilter({
  zones,
  active,
  onSelect,
  count,
}: {
  zones: string[];
  active: string;
  onSelect: (zone: string) => void;
  count?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {zones.map((zone) => (
        <button
          key={zone}
          type="button"
          aria-pressed={active === zone}
          onClick={() => onSelect(zone)}
          className={
            "h-9 min-w-[74px] rounded-full border px-3.5 text-xs font-bold transition-colors " +
            (active === zone
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-border-subtle bg-surface-raised text-brand-700 hover:bg-brand-50")
          }
        >
          {zone}
        </button>
      ))}
      {count && <span className="text-xs font-semibold text-brand-600">{count}</span>}
    </div>
  );
}
