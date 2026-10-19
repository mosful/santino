"use client";

import { audit, domainStore } from "../demo/domainStore";
import { getCurrentRole } from "../roleStore";

function manager() { if (getCurrentRole() !== "系統管理員") throw new Error("僅管理員可修改合約設定。"); }
export const contractSettingActions = {
  reviewDays(days: number) { manager(); if (!Number.isInteger(days) || days < 1 || days > 30) throw new Error("示範審閱期請填 1 至 30 天。"); domainStore.update((data) => { data.contractSettings.reviewDays = days; audit(data, "修改示範審閱天數", "contract"); }); },
  addTemplate() { manager(); let id = 0; domainStore.update((data) => { id = Math.max(0, ...data.contractSettings.templates.map((item) => item.id)) + 1; data.contractSettings.templates.push({ id, name: `合約範本 v${id}（草稿）`, version: `v${id}`, active: false, createdDate: data.demoAt.slice(0, 10), clauses: "示範草稿，請填入院方確認的條文。" }); audit(data, "新增合約範本版本", String(id)); }); return id; },
  activate(id: number) { manager(); domainStore.update((data) => { if (!data.contractSettings.templates.some((item) => item.id === id)) throw new Error("找不到範本。"); data.contractSettings.templates.forEach((item) => { item.active = item.id === id; }); audit(data, "啟用合約範本版本", String(id)); }); },
  save(id: number, name: string, clauses: string) { manager(); if (!name.trim() || !clauses.trim()) throw new Error("請填範本名稱及條文內容。"); domainStore.update((data) => { const template = data.contractSettings.templates.find((item) => item.id === id); if (!template || template.active) throw new Error("啟用中的條文不可直接改寫，請新增草稿版本。"); template.name = name.trim(); template.clauses = clauses.trim(); audit(data, "儲存合約範本草稿", String(id)); }); },
};
