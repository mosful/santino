"use client";

import { useSyncExternalStore } from "react";
import { ROLES, type Role, getAccess, type AccessLevel } from "./permissions";

const STORAGE_KEY = "santino_current_role_v1";
const DEFAULT_ROLE: Role = "系統管理員";
const listeners = new Set<() => void>();
let cache: Role | null = null;

function readRole(): Role {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    if (raw && ROLES.includes(raw)) return raw;
  } catch {
    // 忽略，使用預設角色
  }
  return DEFAULT_ROLE;
}

function getSnapshot(): Role {
  if (cache === null) cache = readRole();
  return cache;
}

function getServerSnapshot(): Role {
  return DEFAULT_ROLE;
}

function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size) window.removeEventListener("storage", onStorage); };
}
function onStorage(event: StorageEvent) { if (event.key === STORAGE_KEY || event.key === null) { cache = null; listeners.forEach((listener) => listener()); window.dispatchEvent(new Event("santino-role-changed")); } }

export function setCurrentRole(role: Role) {
  cache = role;
  try {
    window.localStorage.setItem(STORAGE_KEY, role);
  } catch {
    // localStorage 不可用時安靜忽略
  }
  listeners.forEach((l) => l());
  window.dispatchEvent(new Event("santino-role-changed"));
}

/** 目前模擬登入身分（靜態稿示意用，無真實登入系統） */
export function useCurrentRole(): Role {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 共用資料操作也讀取目前角色，避免只靠按鈕隱藏限制操作。 */
export function getCurrentRole(): Role { return getSnapshot(); }

/** 目前身分對指定模組的存取層級：edit／view／none */
export function useAccess(moduleNo: string): AccessLevel {
  const role = useCurrentRole();
  return getAccess(role, moduleNo);
}
