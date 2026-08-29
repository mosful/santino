"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "santino_session_signature_v1";
const listeners = new Set<() => void>();
let cache: string | null | undefined = undefined;

function readSignature(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): string | null {
  if (cache === undefined) cache = readSignature();
  return cache;
}

function getServerSnapshot(): string | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 簽名可重複應用（系統開發總則#4）：本次登入session簽過一次後，其餘表單的簽名欄位自動帶入同一份簽名 */
export function setSessionSignature(dataUrl: string) {
  cache = dataUrl;
  try {
    window.localStorage.setItem(STORAGE_KEY, dataUrl);
  } catch {
    // 忽略
  }
  listeners.forEach((l) => l());
}

export function clearSessionSignature() {
  cache = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
  listeners.forEach((l) => l());
}

export function useSessionSignature(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
