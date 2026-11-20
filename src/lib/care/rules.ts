import { ROLE_PROFILE, type Role } from "../permissions";
import type { CareEntry, CareField, CareForm, CareKind, CareSubject, CareValues } from "./types";

export function documentKey(subjectId: string, formKey: string) { return `${subjectId}:${formKey}`; }
export function canAuthorizeCare(role: Role) { return role === "管理者" || role === "護理長 婉真"; }
/** 依會議 G06，已簽紀錄由本人或主管修正；模組權限仍須另外通過。 */
export function canReviseCareEntry(role: Role, entry: CareEntry) {
  const { name, fullName } = ROLE_PROFILE[role];
  return canAuthorizeCare(role) || [role, name, fullName, `${name}（${role}）`, `${fullName}（${role}）`].includes(entry.author);
}
export function canEditCare(role: Role, kind: CareKind, formKey: string) {
  if (canAuthorizeCare(role)) return true;
  if (role === "護理師 陳護理師") return true;
  if (role === "衛教師 琳雅") return kind === "mama" || ["feeding", "io", "guidance"].includes(formKey);
  return false;
}
export function canViewCare(role: Role, kind: CareKind, formKey: string) {
  return canEditCare(role, kind, formKey);
}

const DAY_MS = 86_400_000;

/** 取某個時刻在台北時區的當日零點（毫秒）。回補期限以「日」為單位，不看退房當下的時分。 */
function taipeiDayStart(iso: string) {
  return Date.parse(`${new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" })}T00:00:00+08:00`);
}

/**
 * 回補截止時刻＝退房日（台北時區）起算第 days 天的 23:59:59.999。
 * 例：10/1 退房、期限 3 天 → 10/4 23:59:59 以前都可補，10/5 00:00 起算逾期。
 *
 * ⚠️ 不要改回「退房時刻＋N×24 小時」：那樣 10/1 09:00 退房的案子 10/4 09:00 就鎖住，
 * 同一天退房但時間不同的兩個個案截止時刻不一樣，現場無法對外說明。
 */
export function backfillDeadline(subject: CareSubject, days: number) {
  if (!subject.dischargedAt) return null;
  return new Date(taipeiDayStart(subject.dischargedAt) + (days + 1) * DAY_MS - 1).toISOString();
}
export function isBackfillExpired(subject: CareSubject, days: number, at = new Date()) {
  const deadline = backfillDeadline(subject, days);
  return !!deadline && at.valueOf() > Date.parse(deadline);
}

/**
 * 逾期後是否真的鎖住不能補。
 *
 * 客戶 2026-10-22 指示：逾期後**護理長與管理者可以直接補登**，其餘角色要先由他們
 * 填原因授權。因此「已逾期」與「不能編輯」是兩件事，判斷編輯權一律用這支，
 * 不要只看 isBackfillExpired。
 */
export function isBackfillBlocked(role: Role, subject: CareSubject, days: number, authorized: boolean, at = new Date()) {
  return isBackfillExpired(subject, days, at) && !authorized && !canAuthorizeCare(role);
}
export function needsFeedingReassessment(values: CareValues) {
  return values.feedingResult === "再評估" || Object.entries(values).some(([key, value]) => (key.startsWith("feeding-") && value === "再評估") || (key.startsWith("breast-") && value === "困難"));
}
export function moodNeedsAttention(values: CareValues) {
  return (values.score !== undefined && Number(values.score) >= 13) || (values.question10 !== undefined && Number(values.question10) >= 2);
}

/**
 * 產婦入住評估的疫情表要依實際填表人簽名。
 * 畫面與 store 共用同一條規則，避免使用者寫完簽名才發現前置資料尚未確認。
 */
export function mamaAdmissionSignatureError(kind: CareKind, formKey: string, values: CareValues) {
  if (kind !== "mama" || formKey !== "admission") return "";
  if (!values.respondentIdentity) return "請先在「TOCC」選擇填表人身分，再進行簽名。";
  if (values.respondentIdentity !== "孕婦本人" && !String(values.respondent ?? "").trim()) {
    return "填表人為先生或親友時，請先填寫姓名，再進行簽名。";
  }
  return "";
}

export function validateCareForm(form: CareForm, values: CareValues): string[] {
  const errors: string[] = [];
  for (const field of form.sections.flatMap((section) => section.fields)) {
    const value = values[field.key];
    if (field.required && (!value || (Array.isArray(value) ? !value.length : !value.trim()))) errors.push(`請填寫${field.label}。`);
    if (field.type === "date" && typeof value === "string" && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00+08:00`)))) errors.push(`${field.label}格式不正確。`);
    if (field.range && typeof value === "string" && value !== "") {
      const range = parseCareRange(value);
      const outside = (n: number) => (field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max);
      if (!range) errors.push(`${field.label}請填寫數字或範圍（如 2-3）。`);
      else if (range[1] < range[0]) errors.push(`${field.label}範圍前面的數字不可大於後面。`);
      else if (outside(range[0]) || outside(range[1])) errors.push(`${field.label}請填寫${field.min ?? "有效"}至${field.max ?? "合理範圍"}的數字。`);
    } else if (field.type === "number" && typeof value === "string" && value !== "") {
      const number = Number(value);
      if (!Number.isFinite(number) || (field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) {
        errors.push(`${field.label}請填寫${field.min ?? "有效"}至${field.max ?? "合理範圍"}的數字。`);
      }
    }
  }
  if (form.key === "io" && values.milkType === "母乳加配方奶" && String(values.bottleAmount ?? "") !== "" && !String(values.bottleBreastAmount ?? "").trim()) errors.push("奶別為母乳加配方奶時，請填寫其中母乳量。");
  if (form.key === "io" && Number(values.bottleBreastAmount) > Number(values.bottleAmount || 0)) errors.push("其中母乳量不可大於瓶餵量。");
  if (form.key === "feeding" && needsFeedingReassessment(values) && !String(values.reassessmentNote ?? "").trim()) errors.push("有再評估項目，請填寫下方媽媽護理紀錄。");
  // 護理紀錄分三類後不再逐欄必填，但整筆不能全空（原本的單一必填紀錄不降低門檻）。
  if (form.key === "record" && !["executionNote", "continuousNote", "abnormal", "note"].some((key) => String(values[key] ?? "").trim())) errors.push("請至少填寫一類護理紀錄。");
  return errors;
}

/** 全形與其他連接號一律視為「-」，iPad 中文輸入常打出全形。 */
export const normalizeCareRange = (value: string) => value.replace(/[－～~—–]/g, "-").replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0)).trim();
/** 「2」回傳 [2, 2]、「2-3」回傳 [2, 3]，格式不符回傳 null（需求 G11）。 */
export function parseCareRange(value: string): [number, number] | null {
  const match = /^(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?$/.exec(normalizeCareRange(value));
  return match ? [Number(match[1]), Number(match[2] ?? match[1])] : null;
}
/** 血壓只提醒不擋簽出（客戶 2026-10-30「檢查只提醒不要擋」）。 */
export const bloodPressureLooksWrong = (value: string) => !!value.trim() && !/^\d{2,3}\s*\/\s*\d{2,3}$/.test(value.trim());

/* 整列清除（2026-11-20 使用者指示：全站清除一律清掉該列所有選項與文字框）。
   日期、時間、照片不是選項或文字框，不在清除範圍；由其他表單帶入的欄位（如生產方式）也不清。 */
const CLEARABLE = new Set(["radio", "multiple", "select", "text", "textarea", "number", undefined]);
const isChoice = (field: CareField) => field.type === "multiple" || field.type === "radio" || field.type === "select";
/** 該列是否放清除鈕：要有選項欄位，且不能只有「兩選一」單選（可直接切換，不放清除）。 */
export function rowHasClear(fields: CareField[]) {
  return fields.some((field) => !field.readOnlyHint && isChoice(field) && !((field.type === "radio" || field.type === "select") && field.options?.length === 2));
}
export function rowClearPatch(fields: CareField[], values: CareValues): CareValues {
  const keys = fields.filter((field) => !field.readOnlyHint && CLEARABLE.has(field.type)).flatMap((field) => [field.key, ...(field.clearWith ?? [])]);
  return Object.fromEntries([...new Set(keys)].map((key) => [key, Array.isArray(values[key]) ? [] : ""]));
}

/**
 * 同一筆輸入連動的欄位（需求 M07、M10）：
 * - 選了宮底橫指數就是 U−（位置清空）；改選 pelvic 或摸不到時橫指數清空。
 * - 填腹瀉次數／未解天數就自動勾選該項；取消勾選時一併清掉數字。
 */
export function linkCarePatch(values: CareValues, patch: CareValues): CareValues {
  const next = { ...patch };
  // 宮底位置只剩「摸不到／pelvic」（2026-11-20）；選了橫指數就是 U−，位置清空，列印時再勾 U−。
  if (typeof next.fundus === "string" && next.fundus) next.fundusPosition = "";
  if (next.fundusPosition === "pelvic" || next.fundusPosition === "摸不到") next.fundus = "";
  const counts: [string, string][] = [["diarrheaTimes", "腹瀉"], ["noStoolDays", "未解"]];
  for (const [key, option] of counts) {
    if (typeof next[key] !== "string" || "bowel" in next) continue;
    const current = values.bowel;
    const selected = Array.isArray(current) ? current : current ? [current] : [];
    if (next[key] && !selected.includes(option)) next.bowel = [...selected.filter((item) => !conflicts(option, item)), option];
    if (!next[key] && selected.includes(option)) next.bowel = selected.filter((item) => item !== option);
  }
  if (Array.isArray(next.bowel)) {
    for (const [key, option] of counts) if (!next.bowel.includes(option) && values[key]) next[key] = "";
  }
  return next;
}

export function taipeiTimestamp(value: string) {
  return new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });
}

/** 會互相矛盾的選項（需求 M03：並存症狀可複選，但「未解」與「有排便」、上肢正常與上肢水腫等不能同時成立）。 */
const CONFLICT_GROUPS: [string[], string[]][] = [
  [["未解"], ["有，正常", "有，軟", "有，硬", "軟", "硬", "水便", "血便", "腹瀉"]],
  [["有，正常"], ["腹瀉"]],
  [["上肢正常"], ["上肢水腫"]],
  [["下肢正常"], ["下肢水腫"]],
];
export const conflicts = (a: string, b: string) => CONFLICT_GROUPS.some(([x, y]) => (x.includes(a) && y.includes(b)) || (y.includes(a) && x.includes(b)));
