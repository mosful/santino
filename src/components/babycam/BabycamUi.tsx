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

  與 BabyCam 刻意不同之處：
  - BabyCam 的四個功能群組放在左側 244px 側欄；本系統已有一條全域模組側欄，
    再疊一條會變兩層導覽，因此群組改成**卡片內最上方的一列**（`GroupNav`），
    與頁籤同屬一張卡，不另外佔一個區塊。
  - **只剩一個群組時完全不畫群組列**（例如櫃台只有「入住登記」），
    直接顯示該群組的頁籤——一排只有一顆的導覽只是噪音。
  - **不顯示 01／02／04／08 這些編號**：那是權限代號，給管理者在後台對照用的，
    不該出現在每天操作的畫面上。編號仍保留在程式與權限表裡。
*/

export const GROUP_ICONS = { "01": Bed, "02": Tags, "04": SlidersHorizontal, "08": Settings2 } as const;

/**
 * 卡片外框。
 *
 * ⚠️ 標題與說明改為**選用**：群組名稱已經在上方的群組列或頁籤上，
 * 再用一個大標題重寫一次只是把內容往下推（客戶回報「上方選單太多、空白太多」）。
 * 只有真的需要補充說明時才給 `title`／`description`。
 */
export function Panel({
  title,
  description,
  action,
  flush = false,
  children,
}: {
  title?: string;
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
      {(title || action) && (
        <div className={"flex items-start gap-3 " + (flush ? "p-4 pb-0 sm:p-5 sm:pb-0" : "mb-4")}>
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-base font-bold text-stone-800">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
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
  hint,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
  label: string;
  /** 右側的一行說明；取代原本獨立一塊的大標題區。 */
  hint?: string;
}) {
  if (tabs.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 border-b border-border-subtle px-4 pt-3 sm:px-5">
    {/* ⚠️ 必須同時寫 overflow-y-hidden：只寫 overflow-x-auto 時 CSS 會把 overflow-y
          一併算成 auto，而按鈕的 -mb-px 讓內容比容器高 1px，就會冒出一條直向捲軸。 */}
      <div role="group" aria-label={label} className="scroll-fade -mb-px flex gap-1 overflow-x-auto overflow-y-hidden">
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
    {hint && <p className="hidden max-w-[52ch] truncate pb-2.5 text-xs text-stone-500 xl:block" title={hint}>{hint}</p>}
    </div>
  );
}

/**
 * 卡片最上方的導覽列：左邊功能群組，右邊外部連結（QR 掃描、媽媽端、親友端）。
 *
 * ⚠️ 外部連結一定要放在這一列，不要另開一條工具列。
 * 以前它們掛在頁首的 action 區，加上一行角色提示，就多佔掉整整一個band——
 * 客戶直接指著那塊說「重複資訊，整塊拿掉」。
 * 只有一個群組時不畫群組鈕，但這一列仍然存在（因為右邊的連結要有地方放）。
 */
export function GroupNav<T extends string>({
  groups,
  active,
  onSelect,
  action,
}: {
  groups: { id: T; label: string; icon: React.ComponentType<{ className?: string }> }[];
  active: T;
  onSelect: (id: T) => void;
  action?: ReactNode;
}) {
  if (groups.length <= 1 && !action) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface-muted/50 px-2 py-2 sm:px-3">
      {groups.length > 1 && (
        <nav aria-label="寶寶視訊功能" className="scroll-fade flex gap-1 overflow-x-auto overflow-y-hidden">
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
                  "flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors " +
                  (on ? "bg-brand-600 text-white shadow-xs" : "text-stone-600 hover:bg-surface-raised hover:text-brand-700")
                }
              >
                <Icon className="h-[17px] w-[17px] shrink-0" />
                {group.label}
              </button>
            );
          })}
        </nav>
      )}
      {action && <div className="ml-auto flex flex-wrap items-center gap-2">{action}</div>}
    </div>
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
