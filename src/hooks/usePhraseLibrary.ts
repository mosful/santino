"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SEED_PHRASES, type Phrase } from "@/lib/mock/phrases";

const STORAGE_KEY = "santino_phrase_library_v1";
const listeners = new Set<() => void>();
let cache: Phrase[] | null = null;

function readFromStorage(): Phrase[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_PHRASES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_PHRASES;
  } catch {
    return SEED_PHRASES;
  }
}

function getSnapshot(): Phrase[] {
  if (cache === null) cache = readFromStorage();
  return cache;
}

function getServerSnapshot(): Phrase[] {
  return SEED_PHRASES;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writePhrases(next: Phrase[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage 不可用時（無痕模式等）安靜忽略，僅本次瀏覽有效
  }
  listeners.forEach((l) => l());
}

/**
 * 常用語／片語庫（系統開發總則第10條）。
 * 靜態畫面稿沒有真實後端，暫以瀏覽器 localStorage 保存並用
 * useSyncExternalStore 同步，讓「後台設定的片語」在同一瀏覽器的
 * 各護理表單頁面都能看到，方便示範完整流程。
 */
export function usePhraseLibrary() {
  const phrases = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addPhrase = useCallback((input: { category: string; tags: string[]; text: string }) => {
    writePhrases([...getSnapshot(), { id: Date.now(), ...input }]);
  }, []);

  const removePhrase = useCallback((id: number) => {
    writePhrases(getSnapshot().filter((p) => p.id !== id));
  }, []);

  return { phrases, addPhrase, removePhrase };
}
