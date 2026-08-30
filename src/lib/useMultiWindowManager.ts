"use client";

import { useRef, useState } from "react";
import { useSameRoomLock } from "./windowLockStore";

export type OpenWindow = {
  id: string;
  room: string;
  key: string;
  hasSignature: boolean;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
};

/**
 * 多視窗管理（系統開發總則#9）：預設可同時開啟不同房間的表單視窗，
 * 但只要其中一個視窗含簽名步驟，或後台開啟「同房鎖定」開關，則強制鎖在單一房間。
 */
export function useMultiWindowManager() {
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);
  // 起始值高於全站BackToTop按鈕(z-40)，避免拖曳視窗到右下角時被蓋住，
  // 但仍低於Modal(z-50)與提示訊息(z-[60])。
  const zCounter = useRef(41);
  const sameRoomLock = useSameRoomLock();

  function bringToFront(id: string) {
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)));
  }

  function openWindow(room: string, key: string, hasSignature: boolean) {
    const existing = windows.find((w) => w.room === room && w.key === key);
    if (existing) {
      bringToFront(existing.id);
      return;
    }

    const otherRoomWindow = windows.find((w) => w.room !== room);
    const anySignatureOpen = windows.some((w) => w.hasSignature);

    if (otherRoomWindow && (hasSignature || anySignatureOpen)) {
      setBlockedMsg(`⚠ 簽名步驟需鎖定單一房間操作，請先關閉房號${otherRoomWindow.room}的視窗`);
      setTimeout(() => setBlockedMsg(null), 4000);
      return;
    }
    if (otherRoomWindow && sameRoomLock) {
      setBlockedMsg(`⚠ 目前系統設定僅能同時操作同一房間（後台管理可調整），請先關閉房號${otherRoomWindow.room}的視窗`);
      setTimeout(() => setBlockedMsg(null), 4000);
      return;
    }

    zCounter.current += 1;
    const idx = windows.length;
    const id = `${room}-${key}-${Date.now()}`;
    setWindows((ws) => [
      ...ws,
      {
        id,
        room,
        key,
        hasSignature,
        x: 60 + (idx % 5) * 36,
        y: 70 + (idx % 5) * 36,
        z: zCounter.current,
        minimized: false,
      },
    ]);
  }

  function closeWindow(id: string) {
    setWindows((ws) => ws.filter((w) => w.id !== id));
  }

  function closeAll() {
    setWindows([]);
  }

  function toggleMinimize(id: string) {
    const target = windows.find((w) => w.id === id);
    if (target && target.minimized) {
      bringToFront(id);
      return;
    }
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }

  function minimizeAll() {
    setWindows((ws) => ws.map((w) => ({ ...w, minimized: true })));
  }

  return {
    windows,
    openWindow,
    closeWindow,
    closeAll,
    bringToFront,
    toggleMinimize,
    minimizeAll,
    blockedMsg,
  };
}
