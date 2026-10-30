"use client";

import { useSyncExternalStore } from "react";

/*
  簽名庫（開發總則 #4「簽名一次多處帶入」）。

  原本只存一份字串，等於全院共用同一個簽名——媽媽簽完，下一張護理師的簽名欄位
  也會帶到媽媽那一筆。改成依**身分**分開存：

    staff:<角色>    當班人員自己的簽名，本次登入簽過一次，之後每一張都能帶入
    subject:<病歷號> 這位媽媽／家屬的簽名，只帶到同一位個案的其他表單

  ⚠️ 對象簽名**不可以跨個案帶入**。帶錯人的簽名在評鑑上等同偽造，所以 key 用病歷號，
  呼叫端給不出病歷號時寧可不提供帶入（見 CareSignature 的 carryKey）。

  存在 localStorage：DEMO 重新整理後還在，換瀏覽器就沒有，符合「本機展示」的定位。
*/

const STORAGE_KEY = "santino_signatures_v2";
/** 舊版的單一簽名；讀得到就轉成當前角色的員工簽名，不要讓使用者重簽。 */
const LEGACY_KEY = "santino_session_signature_v1";

export type SignatureRecord = { image: string; at: string; label: string };
type SignatureMap = Record<string, SignatureRecord>;

const listeners = new Set<() => void>();
let cache: SignatureMap | null = null;
/** 伺服器端與水合首幀共用同一個空物件，否則每次呼叫都會觸發重渲染。 */
const EMPTY: SignatureMap = {};

function read(): SignatureMap {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cache = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as SignatureMap) : {};
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy && !Object.keys(cache).length) cache = { "staff:舊版簽名": { image: legacy, at: new Date().toISOString(), label: "上次簽名" } };
  } catch {
    cache = {};
  }
  return cache;
}

function persist(next: SignatureMap) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 隱私模式讀寫會丟例外；記不住就算了，簽名本身已經寫進那筆表單。
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 員工（當班人員）的簽名代號。 */
export const staffKey = (role: string) => `staff:${role}`;
/** 個案（媽媽／家屬）的簽名代號；病歷號是唯一識別，房號會換人不能拿來當 key。 */
export const subjectKey = (chartNo: string) => `subject:${chartNo}`;

export function rememberSignature(key: string, image: string, label: string) {
  persist({ ...read(), [key]: { image, at: new Date().toISOString(), label } });
}

export function forgetSignature(key: string) {
  const next = { ...read() };
  delete next[key];
  persist(next);
}

/** 目前記住的所有簽名。 */
export function useSignatures(): SignatureMap {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** 單一代號的簽名；沒有就回 null。 */
export function useSignature(key: string | null): SignatureRecord | null {
  return useSignatures()[key ?? ""] ?? null;
}
