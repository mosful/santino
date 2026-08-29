"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "santino_auth_v1";
const listeners = new Set<() => void>();
let cache: boolean | null = null;

function readAuth(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getSnapshot(): boolean {
  if (cache === null) cache = readAuth();
  return cache;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 靜態畫面稿模擬登入：僅寫localStorage旗標，無真實帳號驗證 */
export function login() {
  cache = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage 不可用時安靜忽略
  }
  listeners.forEach((l) => l());
}

export function logout() {
  cache = false;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
  listeners.forEach((l) => l());
}

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
