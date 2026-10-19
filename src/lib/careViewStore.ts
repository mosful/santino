"use client";

import { useSyncExternalStore } from "react";

export type CareView = "card" | "list";

const STORAGE_KEY = "santino_care_view_v1";
const DEFAULT_VIEW: CareView = "card";
const listeners = new Set<() => void>();
let cache: CareView | null = null;

function readView(): CareView {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "list" ? "list" : DEFAULT_VIEW;
  } catch {
    return DEFAULT_VIEW;
  }
}

function getSnapshot(): CareView {
  if (cache === null) cache = readView();
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setCareView(view: CareView) {
  cache = view;
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // localStorage 不可用時仍保留本次工作階段的檢視方式
  }
  listeners.forEach((listener) => listener());
}

/** 媽媽／寶寶照護的照護對象檢視方式；兩個模組共用同一組設定。 */
export function useCareView(): CareView {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_VIEW);
}
