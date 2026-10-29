"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "santino_sidebar_collapsed_v1";
const DEFAULT_COLLAPSED = false;
/* 平板（含 iPad 橫向 1180px）預設收合成圖示軌：直向只有 820px，
   展開的 240px 選單會把內容區壓到 580px。使用者按開關展開後就記住他的選擇。 */
const TABLET_MAX = 1366;
const listeners = new Set<() => void>();
let cache: boolean | null = null;

function readCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "1";
    // 沒選過時依裝置給預設：平板收合、桌機展開。
    return window.innerWidth <= TABLET_MAX;
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

/** 側邊欄是否收合為純圖示窄軌（桌機與平板共用同一套，平板預設收合）。 */
export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
