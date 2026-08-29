"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "santino_same_room_lock_v1";
const listeners = new Set<() => void>();
let cache: boolean | null = null;

function readLock(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getSnapshot(): boolean {
  if (cache === null) cache = readLock();
  return cache;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 多視窗鎖房範圍開關（系統開發總則#9）：true=多視窗僅限同一房間可多開；false(預設)=不限房間 */
export function setSameRoomLock(v: boolean) {
  cache = v;
  try {
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  } catch {
    // 忽略
  }
  listeners.forEach((l) => l());
}

export function useSameRoomLock(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
