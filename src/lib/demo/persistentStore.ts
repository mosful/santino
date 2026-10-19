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
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!validate(parsed)) throw new Error("展示資料版本不相容，請還原展示資料。");
        snapshot = { data: parsed, storageError: null };
      }
    } catch (error) {
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
