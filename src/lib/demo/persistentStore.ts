"use client";

import { useSyncExternalStore } from "react";

export type StoreSnapshot<T> = { data: T; storageError: string | null };

/** 靜態原型共用資料介面；資料僅保存在同來源瀏覽器，不連線後端。 */
export function createPersistentStore<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
  const server: StoreSnapshot<T> = { data: initial, storageError: null };
  let snapshot = server;
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  function read() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!validate(parsed)) {
        /*
          結構不符＝示範資料改版，直接重設成新版初始值。

          ⚠️ 不要把這件事當成 storageError 丟出去：那是給使用者看的警告橫幅，
          而改版是預期行為、使用者也無從處理。更糟的是舊值沒被覆寫回 localStorage，
          於是每次重新整理都再判一次，那行「示範資料已更新為新版內容…」會出現在
          每一頁、永遠不會消失（客戶實際回報）。寫回去才會只發生一次。
        */
        window.localStorage.setItem(key, JSON.stringify(initial));
        snapshot = { data: structuredClone(initial), storageError: null };
        return;
      }
      snapshot = { data: parsed, storageError: null };
    } catch (error) {
      // 真正的異常才提示：JSON 壞掉、localStorage 被停用或寫滿。
      snapshot = { data: initial, storageError: error instanceof Error ? error.message : "無法讀取本機展示資料。" };
    }
  }

  // Hydration 的第一個 client snapshot 必須與靜態 HTML 使用的 server snapshot 相同；
  // 等元件完成訂閱後才載入 localStorage，避免跨頁保留資料時產生文字 hydration mismatch。
  function getSnapshot() { return snapshot; }
  function onStorage(event: StorageEvent) {
    if (event.key !== key && event.key !== null) return;
    snapshot = server;
    loaded = false;
    read();
    emit();
  }
  function subscribe(listener: () => void) {
    if (listeners.size === 0) window.addEventListener("storage", onStorage);
    listeners.add(listener);
    if (!loaded) {
      read();
      queueMicrotask(emit);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("storage", onStorage);
    };
  }
  function update(change: (data: T) => void) {
    read();
    const next = structuredClone(snapshot.data);
    change(next);
    let storageError: string | null = null;
    try { window.localStorage.setItem(key, JSON.stringify(next)); }
    catch { storageError = "本機儲存空間無法使用，目前只保留於記憶體；重新整理前請先列印或保存內容。"; }
    snapshot = { data: next, storageError };
    emit();
  }

  return {
    get: () => { read(); return snapshot.data; },
    update,
    reset: () => update((data) => { const target = data as Record<string, unknown>; Object.keys(target).forEach((field) => { delete target[field]; }); Object.assign(target, structuredClone(initial)); }),
    useStore: () => useSyncExternalStore(subscribe, getSnapshot, () => server),
  };
}
