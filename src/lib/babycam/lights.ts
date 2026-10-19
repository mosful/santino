import { ringLightFor } from "./ring-light-map";

export const LIGHT_COLORS = ["熄滅", "紅", "綠", "藍", "黃", "洋紅", "青", "白"];
const MIX: Record<string, number> = { 熄滅: 0, 紅: 1, 綠: 2, 藍: 4, 黃: 3, 洋紅: 5, 青: 6, 白: 7 };
/** 僅保留顏色與通道對照，不含任何設備端點。 */
export function lightChannels(code: string, color: string) {
  const light = ringLightFor(code); if (!light) return [];
  return light.channels.map((channel, index) => ({ channel: `${light.zone}-Y${channel.yNumber}`, color: channel.color, enabled: !!((MIX[color] ?? 0) & (1 << index)) }));
}
