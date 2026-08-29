"use client";

import { useSyncExternalStore } from "react";

export type Theme = "warm" | "green" | "blue";

export const THEMES: { value: Theme; label: string; swatch: string }[] = [
  { value: "warm", label: "暖色", swatch: "#e11d48" },
  { value: "green", label: "沉靜綠", swatch: "#3c6548" },
  { value: "blue", label: "專業藍", swatch: "#236276" },
];

const STORAGE_KEY = "santino_theme_v1";
const DEFAULT_THEME: Theme = "warm";
const listeners = new Set<() => void>();
let cache: Theme | null = null;

function isTheme(v: string | null): v is Theme {
  return v === "warm" || v === "green" || v === "blue";
}

function readTheme(): Theme {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(raw)) return raw;
  } catch {
    // 忽略，使用預設主題
  }
  return DEFAULT_THEME;
}

function applyToDocument(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function getSnapshot(): Theme {
  if (cache === null) cache = readTheme();
  return cache;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(theme: Theme) {
  cache = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage 不可用時安靜忽略
  }
  applyToDocument(theme);
  listeners.forEach((l) => l());
}

/** 目前選用的版型配色主題（暖色／沉靜綠／專業藍） */
export function useTheme(): Theme {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return theme;
}
