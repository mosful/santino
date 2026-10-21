"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export const HEADER_SLOT_ID = "app-header-slot";

/*
  頁首插槽的目標節點。

  ⚠️ 用 useSyncExternalStore 而非 useEffect＋useState：靜態匯出下
  effect 內 setState 會造成 hydration 失敗（專案在 CollapsibleSection 踩過）。
  `getServerSnapshot` 回 null，所以伺服器端與首次 client render 都不渲染
  portal，掛載後才補上。
*/
function subscribe() {
  return () => {};
}

function getSnapshot() {
  return document.getElementById(HEADER_SLOT_ID);
}

function getServerSnapshot(): HTMLElement | null {
  return null;
}

/**
 * 把內容送進 AppShell 頁首列正下方的固定插槽。
 *
 * 用於「整頁作業期間都要看得到、而且要能隨時切換」的工具列——例如護理工作區
 * 同時開啟多張表單時的分頁列。這類東西放在頁面最底下等於沒有：
 * 使用者填到一半根本看不到它，也不會想到要捲到底去切換（客戶實際回報）。
 *
 * 插槽在頁首的 sticky 容器內，所以會跟著頁首一起固定在畫面上方。
 * 沒有內容時 `#app-header-slot:empty` 會把它收成 0 高度，不影響其他頁面。
 */
export default function HeaderSlot({ children }: { children: React.ReactNode }) {
  const target = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!target) return null;
  return createPortal(children, target);
}
