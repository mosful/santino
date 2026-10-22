import type { CareField, CareForm, CareKind } from "./types";
import { DEFAULT_ASSESSMENT_FIELDS, getAssessmentFields, type AssessmentField } from "../assessmentConfigStore";
import { HOSPITALS_SHORT } from "../domain/options";

const text = (key: string, label: string, required = false): CareField => ({ key, label, required });
const note = (key: string, label: string, required = false): CareField => ({ key, label, type: "textarea", required });
const number = (key: string, label: string, min = 0, max?: number): CareField => ({ key, label, type: "number", min, max });
const select = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "select", options });
const multiple = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "multiple", options });
const date: CareField = { key: "date", label: "紀錄日期", type: "date", required: true };
const time: CareField = { key: "time", label: "紀錄時間", type: "time", required: true };
const vitals = [number("temperature", "體溫（℃）", 30, 45), number("pulse", "脈搏（次／分）", 0, 250), text("bloodPressure", "血壓（mmHg）"), number("respiration", "呼吸（次／分）", 0, 100)];
const redBottom = select("redBottom", "紅臀分級", ["0", "A", "B", "C", "二級"]);
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

export const MAMA_FORMS: CareForm[] = [
  { key: "admission", label: "入住評估", sections: [
    { label: "入住護理紀錄", fields: [date, time, { key: "birthDate", label: "生產日期", type: "date" }, select("delivery", "生產方式", ["NSD", "C/S", "VED"]), select("hospital", "生產醫院", [...HOSPITALS_SHORT]), select("parity", "胎次", ["G1P1", "G2P2", "G3P3", "其他"]), note("note", "入住護理紀錄", true)] },
    { label: "病史", fields: [multiple("history", "過去病史", ["無", "高血壓", "糖尿病", "甲狀腺", "其他"]), text("allergy", "過敏史"), text("medicine", "用藥"), text("diet", "飲食禁忌"), { key: "vaccineDate", label: "疫苗日", type: "date" }] },
    { label: "身體評估", fields: [...vitals, select("consciousness", "意識", ["清醒", "嗜睡", "其他"]), select("breast", "乳房", ["柔軟", "脹", "硬塊"]), select("lochia", "惡露", ["少", "中", "多"]), select("wound", "會陰／腹部傷口", ["癒合良好", "紅腫", "滲液", "無傷口"])] },
    { label: "家庭評估", fields: [text("caregiver", "主要照顧者"), text("companion", "陪宿者"), select("familySupport", "家庭支持", ["良好", "一般", "需關注"]), note("familyNote", "家庭備註")] },
    { label: "TOCC", fields: [select("travel", "旅遊史 T", ["無", "有"]), text("occupation", "職業 O"), select("contact", "接觸史 C", ["無", "有"]), select("cluster", "群聚 C", ["無", "有"])] },
  ] },
  { key: "ongoing", label: "持續護理", sections: [
    { label: "持續性護理", fields: [date, time, ...vitals, multiple("mood", "情形", ["平穩", "焦慮", "煩躁", "易哭", "其他"]), select("uri", "URI 症狀", ["無", "有"]), select("fundus", "宮底", ["臍下 1 指", "臍下 2 指", "臍下 3 指", "恥骨上"]), multiple("painSites", "疼痛部位（可複選）", ["乳房", "會陰傷口", "腹部傷口", "腹痛", "頭痛", "其他"]), number("painScore", "疼痛分數", 0, 10), text("lochia", "惡露硬度／量／色"), select("breast", "乳房狀況", ["柔軟", "脹", "硬塊", "乳頭破皮"]), select("lactation", "泌乳方式", ["親餵", "手擠", "擠乳器"]), number("pumping", "擠乳次數／日", 0, 30), select("perinealWound", "會陰傷口", ["無傷口", "癒合良好", "紅腫", "滲液"]), select("abdominalWound", "腹部傷口", ["無傷口", "癒合良好", "紅腫", "滲液"])] },
    { label: "敘述性護理", fields: [note("note", "敘述性護理紀錄", true)] },
  ] },
  { key: "record", label: "媽媽護理紀錄", sections: [{ label: "產後持續照護", fields: [date, time, text("week", "產後週數"), note("note", "執行性護理紀錄與產後持續照護指導", true), note("abnormal", "身心異常及特殊狀況處理")] }] },
  paper(false), paper(true), guidance(false),
];

export const BABY_FORMS: CareForm[] = [
  { key: "admission", label: "入住評估", sections: [
    { label: "基本資料", fields: [date, time, { key: "birthDate", label: "出生日期", type: "date" }, select("sex", "性別", ["男", "女"]), text("birthOrder", "胎序"), text("gestation", "出生週數"), text("hospital", "生產醫院"), select("delivery", "生產方式", ["NSD", "VED", "C/S"]), text("apgar", "出生 Apgar"), number("birthWeight", "出生體重（g）", 300, 7000), number("dischargeWeight", "出院體重（g）", 300, 10000), number("weight", "入院體重（g）", 300, 10000), select("feeding", "餵奶方式", ["母奶", "混合", "配方奶"]), number("milk", "入住奶量（cc）", 0, 500)] },
    { label: "新生兒檢查", fields: [select("screening", "新生兒篩檢", ["已做", "未做"]), select("hearing", "聽力篩檢", ["通過", "未通過", "未做"]), { key: "hepatitisDate", label: "B 肝疫苗", type: "date" }, { key: "bcgDate", label: "BCG", type: "date" }, number("jaundice", "黃疸值（mg/dL）", 0, 50)] },
    { label: "身體評估", fields: [number("temperature", "體溫（℃）", 30, 45), number("pulse", "心跳（次／分）", 0, 300), number("respiration", "呼吸（次／分）", 0, 150), select("skin", "皮膚", ["正常", "黃疸", "紅疹", "脫皮"]), select("cord", "臍帶", ["乾燥", "濕潤", "發紅", "已脫落"]), redBottom] },
    { label: "入住護理紀錄", fields: [note("note", "入住護理紀錄", true)] },
  ] },
  { key: "record", label: "寶寶護理紀錄", sections: [{ label: "護理紀錄", fields: [date, time, note("note", "寶寶護理紀錄", true)] }] },
  { key: "daily", label: "每日照護", sections: [{ label: "每日量測與照護", fields: [date, time, number("temperature", "體溫（℃）", 30, 45), number("weight", "體重（g）", 300, 15000), select("bath", "沐浴", ["已完成", "未完成"]), select("cord", "臍帶", ["乾燥", "濕潤", "發紅", "已脫落"]), select("skin", "皮膚", ["正常", "黃疸", "紅疹", "脫皮"]), redBottom, select("phototherapy", "黃疸照光", ["無", "有"]), note("note", "備註")] }] },
  { key: "feeding", label: "哺餵母乳評估", sections: [{ label: "哺餵評估", fields: [date, time, ...["含乳姿勢", "吸吮節律", "吞嚥聲", "乳頭疼痛", "餵奶時間 15–20 分", "餵後滿足"].map((label, index) => select(`feeding-${index}`, label, ["通過", "再評估"]))] }] },
  { key: "growth", label: "成長日記", sections: [{ label: "今日量測", fields: [date, number("weight", "體重（g）", 300, 15000), number("height", "身長（cm）", 10, 100), number("head", "頭圍（cm）", 10, 70), note("note", "成長紀錄")] }] },
  { key: "photo", label: "寶寶身體照片", sections: [{ label: "照片與部位", fields: [date, time, { key: "photo", label: "拍照／選取照片（僅本機預覽）", type: "photo" }, multiple("bodyParts", "部位標記", ["全身", "臍帶", "臀部", "皮膚", "臉部"]), note("note", "照片備註")] }] },
  { key: "io", label: "I/O", sections: [{ label: "餵食與排泄", fields: [date, time, select("feeding", "餵奶", ["母奶 左", "母奶 右", "瓶餵母奶", "配方奶"]), number("amount", "分鐘／奶量（cc）", 0, 500), select("condition", "餵食情況", ["可", "溢奶", "吐奶"]), select("sucking", "吸吮力", ["佳", "中等", "弱"]), select("urine", "尿", ["未解", "自解"]), text("urineDetail", "尿次數／顏色"), select("stool", "便", ["未解", "自解"]), text("stoolDetail", "便次數／量／性質"), note("note", "備註")] }] },
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
