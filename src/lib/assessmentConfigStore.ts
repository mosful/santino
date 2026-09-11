"use client";

import { useSyncExternalStore } from "react";

export type AssessmentFieldType = "text" | "textarea" | "single" | "multiple" | "select";

export type AssessmentField = {
  id: string;
  section: string;
  label: string;
  type: AssessmentFieldType;
  options: string[];
  required: boolean;
};

export const ASSESSMENT_SECTIONS = ["護理紀錄", "病史", "身體評估", "家庭評估", "TOCC"];

export const DEFAULT_ASSESSMENT_FIELDS: AssessmentField[] = [
  { id: "history-food", section: "病史", label: "食物過敏", type: "single", options: ["無", "有"], required: true },
  { id: "history-drug", section: "病史", label: "藥物過敏", type: "single", options: ["無", "有"], required: true },
  { id: "history-pregnancy", section: "病史", label: "妊娠中／產後病史", type: "textarea", options: [], required: false },
  { id: "physical-wound", section: "身體評估", label: "傷口狀況", type: "select", options: ["正常", "需持續觀察", "需轉介"], required: true },
  { id: "physical-pain", section: "身體評估", label: "疼痛部位", type: "multiple", options: ["傷口", "乳房", "子宮收縮", "其他"], required: false },
  { id: "family-support", section: "家庭評估", label: "主要支持者", type: "text", options: [], required: false },
  { id: "tocc-risk", section: "TOCC", label: "旅遊／職業／接觸／群聚風險", type: "select", options: ["無風險", "需追蹤"], required: true },
  { id: "nursing-note", section: "護理紀錄", label: "入住當下護理紀錄", type: "textarea", options: [], required: true },
];

const STORAGE_KEY = "santino_assessment_fields_v1";
const listeners = new Set<() => void>();
let cache: AssessmentField[] | null = null;

function readFields() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ASSESSMENT_FIELDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AssessmentField[]) : DEFAULT_ASSESSMENT_FIELDS;
  } catch {
    return DEFAULT_ASSESSMENT_FIELDS;
  }
}

function getSnapshot() {
  if (cache === null) cache = readFields();
  return cache;
}

function writeFields(next: AssessmentField[]) {
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

export function addAssessmentField(input: Omit<AssessmentField, "id">) {
  writeFields([...getSnapshot(), { ...input, id: `assessment-${Date.now()}` }]);
}

export function updateAssessmentField(id: string, patch: Partial<Omit<AssessmentField, "id">>) {
  writeFields(getSnapshot().map((field) => (field.id === id ? { ...field, ...patch } : field)));
}

export function removeAssessmentField(id: string) {
  writeFields(getSnapshot().filter((field) => field.id !== id));
}

export function resetAssessmentFields() {
  writeFields(DEFAULT_ASSESSMENT_FIELDS);
}

export function useAssessmentFields() {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_ASSESSMENT_FIELDS);
}
