"use client";

import { useSyncExternalStore } from "react";

export type DashboardLayout = "classic" | "journey";

const STORAGE_KEY = "santino_dashboard_layout_v2";
const DEFAULT_LAYOUT: DashboardLayout = "journey";
const listeners = new Set<() => void>();
let cache: DashboardLayout | null = null;

function readLayout(): DashboardLayout {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "classic" ? "classic" : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function getSnapshot(): DashboardLayout {
  if (cache === null) cache = readLayout();
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDashboardLayout(layout: DashboardLayout) {
  cache = layout;
  try {
    window.localStorage.setItem(STORAGE_KEY, layout);
  } catch {
    // localStorage 不可用時仍保留本次工作階段的版型狀態。
  }
  listeners.forEach((listener) => listener());
}

export function useDashboardLayout(): DashboardLayout {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LAYOUT);
}
