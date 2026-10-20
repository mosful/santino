/**
 * 環狀燈的混色與實際呈現色。
 *
 * 數值直接取自 BabyCam 的 `src/lib/ringlight/ring-light-state.ts`（`MIX_CSS`），
 * 兩套系統在現場要並排對照，顏色不同就會誤判。
 *
 * 燈光是**加色混合**（additive，與顏料的減色混合相反）：
 * 紅＋綠＝黃、紅＋藍＝洋紅、綠＋藍＝青、三色全亮＝白。
 * 位元遮罩：bit0＝紅、bit1＝綠、bit2＝藍。
 */

export type MixName = "熄滅" | "紅" | "綠" | "黃" | "藍" | "洋紅" | "青" | "白";

/** ⚠️ 順序就是位元遮罩，不可調動；要改畫面上的排列順序請改 MIX_DISPLAY_ORDER。 */
export const MIXES: MixName[] = ["熄滅", "紅", "綠", "黃", "藍", "洋紅", "青", "白"];

/** 畫面上列出混色的順序：先三個單色，再兩兩相加與三色全亮。 */
export const MIX_DISPLAY_ORDER: MixName[] = ["熄滅", "紅", "綠", "藍", "黃", "洋紅", "青", "白"];

/** 每個混色要開哪幾條通道，現場對照佈線時直接照著開。 */
const MIX_CHANNELS: Record<MixName, string> = {
  熄滅: "", 紅: "R", 綠: "G", 黃: "R＋G",
  藍: "B", 洋紅: "R＋B", 青: "G＋B", 白: "R＋G＋B",
};

const MIX_CSS: Record<MixName, { color: string; glow: string }> = {
  熄滅: { color: "#161c25", glow: "none" },
  紅: { color: "#ff2d20", glow: "0 0 13px rgba(255,45,32,.75)" },
  綠: { color: "#2bd94b", glow: "0 0 13px rgba(43,217,75,.75)" },
  黃: { color: "#ffd60a", glow: "0 0 13px rgba(255,214,10,.8)" },
  藍: { color: "#2f6feb", glow: "0 0 13px rgba(47,111,235,.75)" },
  洋紅: { color: "#ff3bd4", glow: "0 0 13px rgba(255,59,212,.75)" },
  青: { color: "#2ee6e6", glow: "0 0 13px rgba(46,230,230,.75)" },
  白: { color: "#ffffff", glow: "0 0 15px rgba(255,255,255,.85)" },
};

const isMix = (value: string): value is MixName => (MIXES as string[]).includes(value);

/** 燈色的實際呈現（色碼＋光暈）；未知名稱一律當熄滅，不猜。 */
export function mixCss(name: string): { color: string; glow: string } {
  return MIX_CSS[isMix(name) ? name : "熄滅"];
}

/** 顏色名＋通道，例如「洋紅（R＋B）」；熄滅沒有通道。 */
export function mixLabel(name: string): string {
  if (!isMix(name)) return name;
  const channels = MIX_CHANNELS[name];
  return channels ? `${name}（${channels}）` : name;
}

/** 只取通道字串（R／G／B／R＋B…）。 */
export function mixChannels(name: string): string {
  return isMix(name) ? MIX_CHANNELS[name] : "";
}

/** 單一 RGB 通道亮起時的顏色（繼電器板的 R／G／B 按鈕）。 */
export const CHANNEL_CSS: Record<"red" | "green" | "blue", { on: string; border: string; glow: string; label: string }> = {
  red: { on: "#c93c37", border: "#e5534b", glow: "0 0 11px rgba(201,60,55,.5)", label: "R" },
  green: { on: "#2ea043", border: "#3fb950", glow: "0 0 11px rgba(63,185,80,.45)", label: "G" },
  blue: { on: "#2f6feb", border: "#4184e4", glow: "0 0 11px rgba(47,111,235,.5)", label: "B" },
};

/** 由三條通道的開關推回混色名稱。 */
export function mixOf(red: boolean, green: boolean, blue: boolean): MixName {
  return MIXES[(red ? 1 : 0) | (green ? 2 : 0) | (blue ? 4 : 0)];
}
