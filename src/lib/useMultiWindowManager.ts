"use client";

import { useRef, useState } from "react";
import { useSameRoomLock } from "./windowLockStore";

export type OpenWindow = {
  id: string;
  room: string;
  activeKey: string; // 目前作用中的作業頁籤（存在此處，縮小還原後頁籤位置不會跑掉）
  signatureActive: boolean; // 目前作用中的頁籤是否含簽名步驟
  x: number;
  y: number;
  z: number;
  minimized: boolean;
};

// z-index 區間：高於全站 BackToTop(z-40)，但不得追上底部工作列 WindowTray(z-[55])
const Z_BASE = 41;
const Z_MAX = 54;

/**
 * 房卡作業視窗管理（系統開發總則#9）：以「房間」為單位，一間房一個視窗，
 * 視窗內以頁籤切換各項紀錄。預設可同時開啟不同房間比對，但只要有視窗正停在
 * 含簽名步驟的頁籤，或後台開啟「同房鎖定」開關，則強制鎖在單一房間。
 */
export function useMultiWindowManager() {
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);
  const zCounter = useRef(Z_BASE);
  const blockedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sameRoomLock = useSameRoomLock();

  function block(msg: string) {
    if (blockedTimer.current) clearTimeout(blockedTimer.current);
    setBlockedMsg(msg);
    blockedTimer.current = setTimeout(() => setBlockedMsg(null), 4000);
  }

  function bringToFront(id: string) {
    setWindows((ws) => {
      const next = zCounter.current + 1;
      if (next <= Z_MAX) {
        zCounter.current = next;
        return ws.map((w) => (w.id === id ? { ...w, z: next, minimized: false } : w));
      }
      // 已達上限（再加就會蓋住底部工作列），依現有層級重新壓縮回 Z_BASE 起算，被聚焦者排最上層
      const order = ws
        .slice()
        .sort((a, b) => a.z - b.z)
        .map((w) => w.id)
        .filter((x) => x !== id)
        .concat(id);
      zCounter.current = Math.min(Z_BASE + order.length - 1, Z_MAX);
      return ws.map((w) => {
        const z = Math.min(Z_BASE + order.indexOf(w.id), Z_MAX);
        return w.id === id ? { ...w, z, minimized: false } : { ...w, z };
      });
    });
  }

  function openWindow(room: string, defaultKey: string) {
    const existing = windows.find((w) => w.room === room);
    if (existing) {
      bringToFront(existing.id);
      return;
    }

    // 防繞道：已有其他房間停在含簽名頁籤時，不得再開新房間
    const signatureWindow = windows.find((w) => w.signatureActive && w.room !== room);
    if (signatureWindow) {
      block(`⚠ 簽名步驟需鎖定單一房間操作，請先關閉房號${signatureWindow.room}的視窗`);
      return;
    }
    const otherRoomWindow = windows.find((w) => w.room !== room);
    if (otherRoomWindow && sameRoomLock) {
      block(`⚠ 目前系統設定僅能同時操作同一房間（後台管理可調整），請先關閉房號${otherRoomWindow.room}的視窗`);
      return;
    }

    zCounter.current = Math.min(zCounter.current + 1, Z_MAX);
    const idx = windows.length;
    const id = `${room}-${Date.now()}`;
    setWindows((ws) => [
      ...ws,
      {
        id,
        room,
        activeKey: defaultKey,
        signatureActive: false,
        x: 60 + (idx % 5) * 36,
        y: 70 + (idx % 5) * 36,
        z: zCounter.current,
        minimized: false,
      },
    ]);
  }

  /**
   * 切換作業頁籤；切到含簽名步驟的頁籤時，若有其他房間視窗開著則攔截（總則#9）。
   * @returns 是否確實完成切換（false＝被攔截，供頁籤元件決定要不要掛載該頁籤內容）
   */
  function selectTab(id: string, key: string, hasSignature: boolean): boolean {
    const target = windows.find((w) => w.id === id);
    if (!target) return false;

    if (hasSignature) {
      const otherRoomWindow = windows.find((w) => w.room !== target.room);
      if (otherRoomWindow) {
        block(`⚠ 簽名步驟需鎖定單一房間操作，請先關閉房號${otherRoomWindow.room}的視窗`);
        return false;
      }
    }

    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, activeKey: key, signatureActive: hasSignature } : w))
    );
    return true;
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
    selectTab,
    closeWindow,
    closeAll,
    bringToFront,
    toggleMinimize,
    minimizeAll,
    blockedMsg,
  };
}
