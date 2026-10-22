"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "santino_auth_v1";
const listeners = new Set<() => void>();
let cache: boolean | null = null;

/*
  DEMO 預設就是登入狀態（客戶 2026-10-22：展示時不要每次打帳密）。

  ⚠️ 判斷式是「不等於 0」不是「等於 1」：沒有記錄＝沒登出過＝視為已登入。
  登出要寫入 "0" 而不是 removeItem，否則下一次載入又會被當成沒登出過而自動登入。
  這個旗標本來就只是畫面稿的模擬，沒有任何真實帳號驗證。
*/
function readAuth(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function getSnapshot(): boolean {
  if (cache === null) cache = readAuth();
  return cache;
}

function getServerSnapshot(): boolean {
  return true;
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
    // 寫 "0" 而不是刪掉：預設是已登入，刪掉等於沒登出過。
    window.localStorage.setItem(STORAGE_KEY, "0");
  } catch {
    // 忽略
  }
  listeners.forEach((l) => l());
}

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
