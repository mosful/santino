import type { CareField, CareForm, CareKind } from "./types";
import { DEFAULT_ASSESSMENT_FIELDS, getAssessmentFields, type AssessmentField } from "../assessmentConfigStore";
import { BABY_ADMISSION, BABY_DAILY, BABY_GROWTH, BABY_IO, FEEDING_FORM, MAMA_ADMISSION, MAMA_DAILY, MAMA_RECORD } from "./sheetDefinitions";

const text = (key: string, label: string, required = false): CareField => ({ key, label, required });
const note = (key: string, label: string, required = false): CareField => ({ key, label, type: "textarea", required });
const number = (key: string, label: string, min = 0, max?: number): CareField => ({ key, label, type: "number", min, max });
const select = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "select", options });
const multiple = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "multiple", options });
const date: CareField = { key: "date", label: "紀錄日期", type: "date", required: true };
const time: CareField = { key: "time", label: "紀錄時間", type: "time", required: true };
const guidance = (baby: boolean): CareForm => ({
  key: "guidance", label: "護理指導單", signature: true,
  sections: [{ label: "指導與評量", fields: [date, multiple("topics", "衛教主題", baby
    ? ["臍帶護理", "沐浴", "黃疸觀察", "餵奶量與頻率", "拍嗝", "尿布疹預防", "安全睡眠", "體溫測量", "疫苗時程", "返家照護"]
    : ["子宮復舊", "親善哺乳姿勢", "會陰傷口清潔", "剖腹傷口照護", "乳房護理／脹奶處理", "惡露觀察", "產後運動", "情緒調適", "避孕與性生活", "返家注意事項"]),
    select("method", "指導方式", ["口述", "複習指導", "主動教學", "實際操作", "其他"]),
    text("executor", "執行者"), { key: "evaluationDate", label: "評估日期", type: "date" }, text("evaluator", "評估者"),
    select("result", "結果評量", ["了解", "部分了解", "需再指導"]), { key: "reviewDate", label: "複核日期", type: "date" }, note("note", "指導與複核紀錄"),
  ] }],
});
const paper = (mood: boolean): CareForm => ({
  key: mood ? "mood" : "social", label: mood ? "心情量表" : "社會支持",
  sections: [{ label: "紙本量表與後續處理", fields: [date, number("score", "總分", 0, mood ? 30 : undefined),
    ...(mood ? [number("question10", "第 10 題得分", 0, 3)] : []),
    { key: "photo", label: "紙本照片（僅本機預覽）", type: "photo" }, note("followUp", "後續處理內容"),
  ] }],
});

/*
  院方紙本已對齊的表單定義在 sheetDefinitions.ts，這裡只保留尚未對齊的幾張。
  表單代號（admission／ongoing／record…）刻意不變，草稿、房間分頁與已簽紀錄才能繼續沿用同一份狀態。
*/
export const MAMA_FORMS: CareForm[] = [MAMA_ADMISSION, MAMA_DAILY, MAMA_RECORD, paper(false), paper(true), guidance(false)];

export const BABY_FORMS: CareForm[] = [
  BABY_ADMISSION,
  { key: "record", label: "寶寶護理紀錄", sections: [{ label: "護理紀錄", fields: [date, time, note("note", "寶寶護理紀錄", true)] }] },
  BABY_DAILY,
  FEEDING_FORM,
  BABY_GROWTH,
  { key: "photo", label: "寶寶身體照片", sections: [{ label: "照片與部位", fields: [date, time, { key: "photo", label: "拍照／選取照片（僅本機預覽）", type: "photo" }, multiple("bodyParts", "部位標記", ["全身", "臍帶", "臀部", "皮膚", "臉部"]), note("note", "照片備註")] }] },
  BABY_IO,
  guidance(true),
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
  }
  return forms;
}
