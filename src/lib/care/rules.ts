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

export function backfillDeadline(subject: CareSubject, days: number) {
  if (!subject.dischargedAt) return null;
  return new Date(Date.parse(subject.dischargedAt) + days * 86_400_000).toISOString();
}
export function isBackfillExpired(subject: CareSubject, days: number, at = new Date()) {
  const deadline = backfillDeadline(subject, days);
  return !!deadline && at.valueOf() > Date.parse(deadline);
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
