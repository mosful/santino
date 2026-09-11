"use client";

import { useSyncExternalStore } from "react";

export type EnabledPhase = 1 | 2;

const STORAGE_KEY = "santino_enabled_phase_v1";
const DEFAULT_PHASE: EnabledPhase = 2;
const listeners = new Set<() => void>();
let cache: EnabledPhase | null = null;

function readPhase(): EnabledPhase {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1" ? 1 : DEFAULT_PHASE;
  } catch {
    return DEFAULT_PHASE;
  }
}

function getSnapshot(): EnabledPhase {
  if (cache === null) cache = readPhase();
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setEnabledPhase(phase: EnabledPhase) {
  cache = phase;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(phase));
  } catch {
    // localStorage 不可用時安靜忽略
  }
  listeners.forEach((listener) => listener());
}

/** 全站目前顯示至哪一開發階段；Phase 2 會同時包含 Phase 1 功能。 */
export function useEnabledPhase(): EnabledPhase {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_PHASE);
}
