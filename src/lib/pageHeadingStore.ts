"use client";

import { useSyncExternalStore } from "react";

export type PageHeading = { title: string; moduleNo?: string } | null;

// 頁面標題改由 AppShell 的頁首列渲染，與登入者資訊同一列；
// 各頁仍用 PageHeader 宣告自己的標題，由這支 store 傳給頁首。
let current: PageHeading = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setPageHeading(next: PageHeading) {
  if (current?.title === next?.title && current?.moduleNo === next?.moduleNo) return;
  current = next;
  emit();
}

/** 離開頁面時只清掉自己留下的標題，避免清到後續頁面剛設好的值。 */
export function clearPageHeading(title: string) {
  if (current?.title !== title) return;
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePageHeading(): PageHeading {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
