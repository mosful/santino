"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "santino_sidebar_collapsed_v1";
const DEFAULT_COLLAPSED = false;
const listeners = new Set<() => void>();
let cache: boolean | null = null;

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return DEFAULT_COLLAPSED;
  }
}

function getSnapshot(): boolean {
  if (cache === null) cache = readCollapsed();
  return cache;
}

function getServerSnapshot(): boolean {
  return DEFAULT_COLLAPSED;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSidebarCollapsed(collapsed: boolean) {
  cache = collapsed;
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // localStorage 不可用時安靜忽略
  }
  listeners.forEach((l) => l());
}

/** 桌機側邊欄是否收合為純圖示窄軌 */
export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
