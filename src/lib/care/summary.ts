import type { CareEntry, CareValues } from "./types";

const text = (value: CareValues[string] | undefined) => Array.isArray(value) ? value.join("、") : (value ?? "");
const num = (value: CareValues[string] | undefined) => { const parsed = Number(text(value)); return Number.isFinite(parsed) ? parsed : 0; };

export type GrowthDay = {
  date: string;
  breastMilk: number; formula: number; totalMilk: number; breastMinutes: number;
  urine: number; stoolPaste: number; stoolLeak: number; stoolOther: number;
  weight?: number; height?: number; head?: number;
};

/**
 * 成長日記的每日彙整（需求 B04／B07）。
 *
 * 同日多筆餵食累加，不是只取最後一筆；身長、頭圍一週量一次，缺測日留白不補造。
 * 黃糊與綠糊都算糊便、黃滲與綠滲都算滲便，顏色不讓同一種性狀漏計。
 */
export function growthDays(entries: CareEntry[]): GrowthDay[] {
  const days = new Map<string, GrowthDay>();
  const day = (date: string) => {
    let found = days.get(date);
    if (!found) { found = { date, breastMilk: 0, formula: 0, totalMilk: 0, breastMinutes: 0, urine: 0, stoolPaste: 0, stoolLeak: 0, stoolOther: 0 }; days.set(date, found); }
    return found;
  };
  for (const entry of [...entries].reverse()) {
    const date = text(entry.values.date);
    if (!date) continue;
    const row = day(date);
    if (entry.formKey === "io") {
      const amount = num(entry.values.bottleAmount);
      if (text(entry.values.milkType) === "配方奶") row.formula += amount;
      else if (text(entry.values.milkType)) row.breastMilk += amount;
      row.totalMilk += amount;
      row.breastMinutes += num(entry.values.leftMinutes) + num(entry.values.rightMinutes);
      if (text(entry.values.urine) === "自解") row.urine += num(entry.values.urineTimes) || 1;
      if (text(entry.values.stool) === "自解") {
        const times = num(entry.values.stoolTimes) || 1;
        const forms = Array.isArray(entry.values.stoolForm) ? entry.values.stoolForm : [text(entry.values.stoolForm)].filter(Boolean);
        if (forms.some((form) => form.includes("糊"))) row.stoolPaste += times;
        else if (forms.some((form) => form.includes("滲"))) row.stoolLeak += times;
        else row.stoolOther += times;
      }
    }
    // 每日照護與成長日記的量測同屬一筆；後填的覆蓋先填的，缺測欄位不覆寫成空白。
    for (const key of ["weight", "height", "head"] as const) if (num(entry.values[key])) row[key] = num(entry.values[key]);
  }
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** 取某位寶寶最近一次已簽出的量測，供 I/O 與成長日記自動帶入（需求 G05）。 */
export function latestMeasurement(entries: CareEntry[], date: string): CareValues {
  const values: CareValues = {};
  for (const entry of entries) {
    if (text(entry.values.date) !== date) continue;
    for (const key of ["weight", "height", "head"] as const) if (!values[key] && num(entry.values[key])) values[key] = text(entry.values[key]);
  }
  return values;
}

/** I/O 的「帶入上一筆餵食」只複製奶別與奶量，時間與排泄仍要按本次實況填（需求 B08）。 */
export function lastFeeding(entries: CareEntry[]): CareValues | undefined {
  const entry = entries.find((item) => item.formKey === "io" && (text(item.values.milkType) || num(item.values.bottleAmount)));
  return entry && { milkType: text(entry.values.milkType), bottleAmount: text(entry.values.bottleAmount) };
}

/**
 * 選「自解」時帶出院方預設，切回「未解」時清掉矛盾的次數與性狀（需求 B06）。
 * 只在使用者剛改動該欄時套用，已填的值不覆寫。
 */
export function applyIoDefaults(patch: CareValues, values: CareValues): CareValues {
  const next = { ...patch };
  if (patch.urine === "自解") { if (!values.urineTimes) next.urineTimes = "1"; if (!values.urineColor) next.urineColor = "淡黃"; }
  if (patch.urine === "未解") { next.urineTimes = ""; next.urineColor = ""; }
  if (patch.stool === "自解" && !values.stoolTimes) next.stoolTimes = "1";
  if (patch.stool === "未解") { next.stoolTimes = ""; next.stoolAmount = ""; next.stoolForm = []; }
  return next;
}
