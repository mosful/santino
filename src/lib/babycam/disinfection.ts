import { shiftDate } from "../dates";
import type { DemoDomain } from "../domain/types";

export type Disinfection = DemoDomain["disinfections"][number];

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"] as const;

/** 台北時間的星期（0＝週日）。排程是院方用當地時間排的，伺服器時區不一定一致。 */
export function taipeiWeekday(at: Date): number {
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", weekday: "short" }).format(at);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label);
}

/** 排程的人類可讀描述，排程表與觀看端共用同一句。 */
export function describeDisinfection(item: Disinfection): string {
  const when = item.weekday === null ? item.date || "未指定日期" : `每週${WEEKDAY_NAMES[item.weekday] ?? "？"}`;
  const where = item.rooms.length ? item.rooms.join("、") : "全院";
  return `${when} ${item.start}–${item.end}｜${where}`;
}

/**
 * 此刻是否有消毒進行中。
 *
 * `room` 省略＝只看全院排程；帶房號則再加上該房的專屬排程。托嬰寶寶沒有房號，
 * 傳空字串即可，只會吃到全院排程——那正是它該有的行為。
 *
 * ⚠️ 時段比對交給 isWithinSchedule，跨午夜（例如 22:00–02:00）才不會判錯；
 * 那段邏輯已有單元測試，不要在這裡自己再寫一次大小比較。
 */
export function activeDisinfection(data: DemoDomain, room: string, at = new Date(data.demoAt)): Disinfection | null {
  const weekday = taipeiWeekday(at);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
  const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
  for (const item of data.disinfections ?? []) {
    if (!item.enabled) continue;
    // 跨午夜的後半段屬於前一天開始的排程；結束時間到點即解除遮蔽。
    const crossesMidnight = item.start > item.end;
    const previousDay = crossesMidnight && clock < item.end;
    const scheduledDate = previousDay ? shiftDate(date, -1) : date;
    const scheduledWeekday = previousDay ? (weekday + 6) % 7 : weekday;
    if (item.weekday === null ? item.date !== scheduledDate : item.weekday !== scheduledWeekday) continue;
    if (item.rooms.length && !item.rooms.includes(room)) continue;
    if (crossesMidnight ? clock >= item.start || clock < item.end : clock >= item.start && clock < item.end) return item;
  }
  return null;
}
