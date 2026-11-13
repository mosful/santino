import type { CareForm, CareKind, CareValues } from "./types";

/** 只轉換能確定對應的舊值；原欄位保留，未知內容交由使用者核對。 */
export function normalizeSheetValues(kind: CareKind, formKey: string, original: CareValues): CareValues {
  const values = structuredClone(original);
  if (formKey !== "admission") return values;
  if (kind === "mama") {
    const parity = typeof values.parity === "string" ? /^G(\d+)P(\d+)(?:A(\d+))?$/.exec(values.parity) : null;
    if (parity) { values.gravida ??= parity[1]; values.para ??= parity[2]; if (parity[3]) values.abortus ??= parity[3]; }
    const delivery = { NSD: "NSD 自然產", "C/S": "C/S 剖腹產", VED: "VED 真空吸引" };
    if (typeof values.delivery === "string" && values.delivery in delivery) values.delivery = delivery[values.delivery as keyof typeof delivery];
  } else {
    const apgar = typeof values.apgar === "string" ? /^(10|[0-9])\s*\/\s*(10|[0-9])$/.exec(values.apgar) : null;
    if (apgar) { values.apgar1 ??= apgar[1]; values.apgar5 ??= apgar[2]; }
  }
  return values;
}

const legacyLabels: Record<string, string> = {
  parity: "原胎次", apgar: "原 Apgar 紀錄", wound: "原傷口紀錄", lochia: "原惡露紀錄", support: "原支持系統", redBottom: "原紅臀紀錄",
  "feeding-0": "原含乳姿勢", "feeding-1": "原吸吮節律", "feeding-2": "原吞嚥聲", "feeding-3": "原乳頭疼痛", "feeding-4": "原餵奶時間", "feeding-5": "原餵後滿足",
  week: "原產後週數", note: "原紀錄內容", uri: "原 URI 症狀", feeding: "原餵奶方式", amount: "原分鐘／奶量",
  urineDetail: "原排尿說明", stoolDetail: "原排便說明", bath: "原沐浴紀錄", phototherapy: "原黃疸照光紀錄",
};
export function legacySheetFields(form: CareForm, values: CareValues) {
  const known = new Set([...form.sections.flatMap((section) => section.fields.map((field) => field.key)), "reassessmentNote", "photo"]);
  return Object.entries(values).filter(([key, value]) => !known.has(key) && (Array.isArray(value) ? value.length : value?.trim())).map(([key]) => ({ key, label: legacyLabels[key] ?? `原有補充（${key}）`, type: "textarea" as const }));
}
