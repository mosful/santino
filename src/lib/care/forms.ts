import type { CareField, CareForm, CareKind } from "./types";
import { DEFAULT_ASSESSMENT_FIELDS, getAssessmentFields, type AssessmentField } from "../assessmentConfigStore";
import { guidanceForm } from "./guidance";
import { BABY_ADMISSION, BABY_DAILY, BABY_GROWTH, BABY_IO, FEEDING_FORM, MAMA_ADMISSION, MAMA_DAILY, MAMA_RECORD } from "./sheetDefinitions";
import { scaleForm } from "./scales";

const note = (key: string, label: string, required = false): CareField => ({ key, label, type: "textarea", required });
const multiple = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "multiple", options });
const date: CareField = { key: "date", label: "紀錄日期", type: "date", required: true };
const time: CareField = { key: "time", label: "紀錄時間", type: "time", required: true };
/*
  院方紙本已對齊的表單定義在 sheetDefinitions.ts，這裡只保留尚未對齊的幾張。
  表單代號（admission／ongoing／record…）刻意不變，草稿、房間分頁與已簽紀錄才能繼續沿用同一份狀態。
*/
export const MAMA_FORMS: CareForm[] = [MAMA_ADMISSION, MAMA_DAILY, MAMA_RECORD, scaleForm("social"), scaleForm("mood"), guidanceForm("mama")];

export const BABY_FORMS: CareForm[] = [
  BABY_ADMISSION,
  { key: "record", label: "寶寶護理紀錄", sections: [{ label: "護理紀錄", fields: [date, time, note("note", "寶寶護理紀錄", true)] }] },
  BABY_DAILY,
  FEEDING_FORM,
  BABY_GROWTH,
  { key: "photo", label: "寶寶身體照片", sections: [{ label: "照片與部位", fields: [date, time, { key: "photo", label: "拍照／選取照片（僅本機預覽）", type: "photo" }, multiple("bodyParts", "部位標記", ["全身", "臍帶", "臀部", "皮膚", "臉部"]), note("note", "照片備註")] }] },
  BABY_IO,
  guidanceForm("baby"),
];

/** v24 基本欄位保留，管理端新增或修改的題目併入對應區段。 */
export function careForms(kind: CareKind, configured: AssessmentField[] = getAssessmentFields()) {
  if (kind === "baby") return BABY_FORMS;
  const forms = structuredClone(MAMA_FORMS);
  const admission = forms[0];
  const mapped: Record<string, string> = { "nursing-note": "note", "physical-wound": "wound", "family-support": "caregiver" };
  for (const field of configured) {
    const initial = DEFAULT_ASSESSMENT_FIELDS.find((item) => item.id === field.id);
    if (initial && JSON.stringify(initial) === JSON.stringify(field)) continue;
    const key = mapped[field.id] ?? `configured-${field.id}`;
    admission.sections.forEach((section) => { section.fields = section.fields.filter((item) => item.key !== key); });
    const label = field.section === "護理紀錄" ? "入住護理紀錄" : field.section;
    let section = admission.sections.find((item) => item.label === label);
    if (!section) { section = { label, fields: [] }; admission.sections.push(section); }
    section.fields.push({ key, label: field.label, type: field.type === "single" ? "select" : field.type, options: field.options, required: field.required });
    if (admission.paperTemplate) admission.supplementalKeys = [...new Set([...(admission.supplementalKeys ?? []), key])];
  }
  return forms;
}
