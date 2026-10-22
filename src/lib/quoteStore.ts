"use client";

import { useSyncExternalStore } from "react";

/**
 * 套餐速算的暫存試算。
 *
 * 諮詢時常要比較兩三個方案（24 天精緻 vs 30 天 VIP），客戶 2026-10-22 要求能先暫存。
 *
 * ⚠️ 刻意**不放進 DemoDomain**：那份資料結構一改就要進版、進版會把使用者在 DEMO 裡
 * 輸入的東西全部洗掉。試算只是草稿，用自己的 localStorage key 存就好。
 * ⚠️ localStorage 是外部狀態，一律 useSyncExternalStore 讀；靜態匯出下
 * 伺服器端回空陣列，水合後才切到記住的值，否則 hydration 會失敗。
 */

export type SavedQuote = {
  id: string;
  at: string;
  name: string;
  phone: string;
  roomType: string;
  days: number;
  hospital: string;
  priceClass: string;
  corporateCompany: string;
  total: number;
};

const STORAGE_KEY = "santino_saved_quotes_v1";
const listeners = new Set<() => void>();
let cache: SavedQuote[] | null = null;
/** 伺服器端與水合首幀共用的同一個空陣列，否則每次呼叫都會觸發重渲染。 */
const EMPTY: SavedQuote[] = [];

function read(): SavedQuote[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? (parsed.filter((item) => item && typeof item === "object") as SavedQuote[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: SavedQuote[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 隱私模式會丟例外；存不起來就算了，不影響試算本身。
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSavedQuotes(): SavedQuote[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const quoteActions = {
  /** 暫存一筆試算；最多留 10 筆，超過就把最舊的擠掉。 */
  save(quote: Omit<SavedQuote, "id" | "at">) {
    write([{ ...quote, id: crypto.randomUUID(), at: new Date().toISOString() }, ...read()].slice(0, 10));
  },
  remove(id: string) {
    write(read().filter((item) => item.id !== id));
  },
  clear() {
    write([]);
  },
};
