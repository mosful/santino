import type { Role } from "../permissions";
import type { CareForm, CareKind, CareSubject, CareValues } from "./types";

export function documentKey(subjectId: string, formKey: string) { return `${subjectId}:${formKey}`; }
export function canAuthorizeCare(role: Role) { return role === "管理者" || role === "護理長 婉真"; }
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
  return Object.entries(values).some(([key, value]) => key.startsWith("feeding-") && value === "再評估");
}
export function moodNeedsAttention(values: CareValues) {
  return (values.score !== undefined && Number(values.score) >= 13) || (values.question10 !== undefined && Number(values.question10) >= 2);
}
export function validateCareForm(form: CareForm, values: CareValues): string[] {
  const errors: string[] = [];
  for (const field of form.sections.flatMap((section) => section.fields)) {
    const value = values[field.key];
    if (field.required && (!value || (Array.isArray(value) ? !value.length : !value.trim()))) errors.push(`請填寫${field.label}。`);
    if (field.type === "date" && typeof value === "string" && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00+08:00`)))) errors.push(`${field.label}格式不正確。`);
    if (field.type === "number" && typeof value === "string" && value !== "") {
      const number = Number(value);
      if (!Number.isFinite(number) || (field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) {
        errors.push(`${field.label}請填寫${field.min ?? "有效"}至${field.max ?? "合理範圍"}的數字。`);
      }
    }
  }
  if (form.key === "feeding" && needsFeedingReassessment(values) && !String(values.reassessmentNote ?? "").trim()) errors.push("有再評估項目，請填寫下方媽媽護理紀錄。");
  return errors;
}

export function taipeiTimestamp(value: string) {
  return new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });
}
