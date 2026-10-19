"use client";

import type { Role } from "../permissions";
import type { DemoDomain } from "./types";
import type { CareState } from "../care/types";
import { audit, domainStore } from "../demo/domainStore";
import { careStore } from "../care/store";
import { getCurrentRole } from "../roleStore";
import { backfillDeadline } from "../care/rules";
import { caseBalance } from "./rules";

export const TASK_CATEGORIES = ["入住", "退房", "參觀", "合約／猶豫期", "待收款", "醫師巡診", "課程", "關懷／提醒", "回補期限", "托嬰"];
export type Task = { id: string; date: string; category: string; title: string; href: string; handled: boolean };
export function roleTaskCategories(role: Role) {
  if (["系統管理員", "阿長 婉真"].includes(role)) return TASK_CATEGORIES;
  if (role === "櫃台") return TASK_CATEGORIES.filter((item) => !["醫師巡診", "回補期限"].includes(item));
  if (role === "衛教師 琳雅") return ["關懷／提醒", "回補期限"];
  if (role === "護理師") return ["醫師巡診", "回補期限", "托嬰"];
  return [];
}
const plusDays = (date: string, days: number) => new Date(Date.parse(date.length === 10 ? `${date}T00:00:00+08:00` : date) + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
export function taskEvents(data: DemoDomain, care: CareState): Task[] {
  const events: Omit<Task, "handled">[] = data.tasks.map((task) => ({ ...task, href: task.caseId ? `/cases/detail/?id=${encodeURIComponent(task.caseId)}` : task.category === "課程" ? "/course/" : "/mama/" }));
  for (const record of data.cases.filter((item) => !item.closed || item.childcare && !item.childcareEnded)) {
    const href = `/cases/detail/?id=${encodeURIComponent(record.id)}`;
    const add = (category: string, date: string, title: string) => { if (date) events.push({ id: `${record.id}:${category}`, date, category, title: `${record.name}｜${title}`, href }); };
    if (record.stage <= 1) add("參觀", record.visitDate, "參觀預約");
    if (record.stage <= 3) add("合約／猶豫期", record.reviewStart ? plusDays(record.reviewStart, 5) : record.signedDate, "審閱期／簽約");
    if (!record.dischargedAt) { add("入住", record.actualAdmission || record.dueDate, `${record.room || "待排房"} 入住`); if (record.actualAdmission) add("退房", plusDays(record.actualAdmission, record.days), "預計退房"); }
    if (caseBalance(record) > 0) add("待收款", record.actualAdmission || record.signedDate || record.visitDate, `待收 ${caseBalance(record).toLocaleString("zh-TW")} 元`);
    if (record.childcare && !record.childcareEnded && record.dischargedAt) add("托嬰", plusDays(record.dischargedAt, record.childcareDays), "托嬰接回期限");
  }
  for (const subject of data.subjects.filter((item) => item.historical && item.dischargedAt)) {
    const deadline = backfillDeadline(subject, care.backfillDays);
    if (deadline) events.push({ id: `${subject.id}:backfill`, date: plusDays(deadline, 0), category: "回補期限", title: `${subject.name}｜${subject.chartNo} 回補期限`, href: `/${subject.kind}/` });
  }
  return events.map((event) => ({ ...event, handled: data.handledTasks.includes(event.id) })).sort((a, b) => a.date.localeCompare(b.date));
}
export const taskActions = {
  complete(id: string) { domainStore.update((data) => { const event = taskEvents(data, careStore.get()).find((item) => item.id === id); if (!event || !roleTaskCategories(getCurrentRole()).includes(event.category)) throw new Error("此類待辦僅可檢視，不能以目前角色處理。"); if (!data.handledTasks.includes(id)) { data.handledTasks.push(id); audit(data, "待辦已處理", id); } }); },
  add(date: string, category: string, title: string) { domainStore.update((data) => { if (!roleTaskCategories(getCurrentRole()).includes(category) || !TASK_CATEGORIES.includes(category) || !date || !title.trim()) throw new Error("請填日期、內容並選擇目前角色可處理的類別。"); data.tasks.push({ id: crypto.randomUUID(), date, category, title: title.trim() }); audit(data, "新增本機待辦", category); }); },
};
