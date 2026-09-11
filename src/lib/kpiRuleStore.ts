"use client";

import { useSyncExternalStore } from "react";

export const RED_RASH_GRADES = ["0級", "A級", "B級", "C級", "二級"] as const;
export type RedRashGrade = (typeof RED_RASH_GRADES)[number];

export type KpiRule = {
  id: string;
  label: string;
  numerator: string;
  denominator: string;
  target: number;
};

export type KpiSettings = {
  rules: KpiRule[];
  includedRashGrades: RedRashGrade[];
};

export const DEFAULT_KPI_SETTINGS: KpiSettings = {
  rules: [
    { id: "exclusive", label: "純母乳哺育率", numerator: "純母乳寶寶人數", denominator: "入住寶寶總人數", target: 70 },
    { id: "rooming", label: "3天8小時親子同室率A", numerator: "達成親子同室人數", denominator: "符合條件產婦人數", target: 65 },
    { id: "rash", label: "紅臀發生率", numerator: "納入分級的紅臀人數", denominator: "照護寶寶總人數", target: 5 },
    { id: "guidance", label: "護理指導達成率", numerator: "完成且簽名人數", denominator: "應完成指導人數", target: 95 },
  ],
  includedRashGrades: ["A級", "B級", "C級", "二級"],
};

const STORAGE_KEY = "santino_kpi_settings_v1";
const listeners = new Set<() => void>();
let cache: KpiSettings | null = null;

function readSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KPI_SETTINGS;
    const parsed = JSON.parse(raw) as KpiSettings;
    return parsed?.rules && parsed?.includedRashGrades ? parsed : DEFAULT_KPI_SETTINGS;
  } catch {
    return DEFAULT_KPI_SETTINGS;
  }
}

function getSnapshot() {
  if (cache === null) cache = readSettings();
  return cache;
}

function writeSettings(next: KpiSettings) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 原型環境無法使用localStorage時，仍保留本次瀏覽狀態。
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateKpiRule(id: string, patch: Partial<Omit<KpiRule, "id">>) {
  const settings = getSnapshot();
  writeSettings({ ...settings, rules: settings.rules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule) });
}

export function toggleRedRashGrade(grade: RedRashGrade) {
  const settings = getSnapshot();
  const included = settings.includedRashGrades.includes(grade);
  writeSettings({
    ...settings,
    includedRashGrades: included
      ? settings.includedRashGrades.filter((item) => item !== grade)
      : [...settings.includedRashGrades, grade],
  });
}

export function resetKpiSettings() {
  writeSettings(DEFAULT_KPI_SETTINGS);
}

export function useKpiSettings() {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_KPI_SETTINGS);
}
