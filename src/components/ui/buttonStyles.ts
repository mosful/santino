/*
  全站唯一的按鈕樣式來源。

  ⚠️ 不要再在各元件裡自己寫 `const button = "min-h-12 rounded-lg border ..."`。
  專案曾有 12 份各自為政的複本，造成三個實際回報的缺陷：

  1. 高度不一致 —— min-h-10／min-h-12、px-3／px-4 混用。
  2. 滑過去全白 —— 複本的基底含 `hover:bg-stone-100`，呼叫端再疊
     `bg-brand-600 text-white`。Tailwind v4 的 hover 變體排在基礎工具類之後，
     hover 時底色被蓋回淺灰、文字仍是白的，按鈕整顆看不見。
  3. 文字未垂直置中 —— 只給 min-height 而沒有 flex 置中，內含圖示＋文字時更明顯。

  因此這裡一律用「固定 height ＋ inline-flex 置中」，而且每個 variant 自己帶
  完整的 bg／text／hover／active，呼叫端不需要（也不應該）再覆寫顏色。
*/

export type ButtonVariant =
  | "primary" // 主要行動：品牌實心
  | "secondary" // 次要行動：白底描邊（最常用）
  | "ghost" // 低調行動：透明底，hover 才上色
  | "danger" // 破壞性行動
  | "subtle" // 灰底填充，用於工具列、分頁鈕
  | "success" // 完成／確認類行動
  | "link"; // 外觀像連結

export type ButtonSize = "sm" | "md" | "lg";

/** 桌機高度；觸控環境另由 globals.css 的 `.btn` 媒體查詢整體抬高，不在這裡分岔。 */
const SIZE: Record<ButtonSize, string> = {
  sm: "btn-sm h-9 gap-1.5 rounded-lg px-3 text-xs",
  md: "btn-md h-10 gap-2 rounded-lg px-4 text-sm",
  lg: "btn-lg h-12 gap-2 rounded-xl px-5 text-base",
};

/** 方形圖示鈕：寬度等於高度，不吃水平內距。 */
const ICON_SIZE: Record<ButtonSize, string> = {
  sm: "btn-sm h-9 w-9 rounded-lg",
  md: "btn-md h-10 w-10 rounded-lg",
  lg: "btn-lg h-12 w-12 rounded-xl",
};

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:bg-brand-700",
  secondary:
    "border border-border-subtle bg-surface-raised text-stone-700 shadow-2xs hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100",
  ghost:
    "border border-transparent bg-transparent text-stone-600 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100",
  danger:
    "border border-transparent bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-700",
  subtle:
    "border border-transparent bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300",
  success:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 active:bg-emerald-200",
  link: "border border-transparent bg-transparent px-0 text-brand-600 underline underline-offset-4 hover:text-brand-700",
};

/**
 * 「選取中」的狀態樣式。
 *
 * 分頁鈕／篩選鈕過去寫成 `${button} ${active ? "bg-brand-600 text-white" : ""}`，
 * 正是 hover 全白的來源。改走 `selected` 旗標，由這裡一次給齊 hover／active，
 * 滑鼠移上去仍是品牌色而不是淺灰。
 */
const SELECTED =
  "!border-brand-600 !bg-brand-600 !text-white hover:!bg-brand-700 hover:!text-white active:!bg-brand-700";

export const BASE =
  "btn inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap text-center font-medium leading-none transition-colors disabled:pointer-events-none disabled:opacity-50";

export function buttonStyles({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  selected = false,
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  selected?: boolean;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return [
    BASE,
    iconOnly ? ICON_SIZE[size] : SIZE[size],
    VARIANT[variant],
    selected ? SELECTED : "",
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
