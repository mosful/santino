"use client";

import { useSyncExternalStore } from "react";
import { ArrowUp } from "lucide-react";

/*
  回到頁首。全站共用，掛在根 layout 與頁尾，各頁不必自己處理。

  ⚠️ 門檻不要再調高。原本寫死 400px，結果像寶寶視訊這種只多出 373px 的頁面
  永遠拿不到按鈕——看得到捲軸、卻沒有回頁首的入口。改用視窗比例（半個視窗）
  也一樣擋掉它，所以兩邊都用固定的 200px：短頁面不會冒出沒用的按鈕，
  真的要捲的頁面一定拿得到。

  ⚠️ 一定要監看頁面高度。全站的可收合區塊（CollapsibleSection）一展開／收合
  就改變 scrollHeight，只聽 scroll 與 resize 會算在舊高度上。
*/

/**
 * 捲過這個距離才出現浮動鈕；再低會在一般滑鼠滾輪一格內閃爍。
 * 整頁可捲的量也用同一個值判定「這頁值不值得給回頁首入口」——
 * 67～140px 那種只是頁尾擠出來的溢出，按了跟沒按一樣。
 */
const THRESHOLD = 200;

const SCROLLED_BIT = 1;
const SCROLLABLE_BIT = 2;

function subscribe(listener: () => void) {
  window.addEventListener("scroll", listener, { passive: true });
  window.addEventListener("resize", listener);
  // 內容高度會隨區塊收合、清單切換而變，光靠 scroll／resize 會漏掉。
  const observer = new ResizeObserver(listener);
  observer.observe(document.documentElement);
  return () => {
    window.removeEventListener("scroll", listener);
    window.removeEventListener("resize", listener);
    observer.disconnect();
  };
}

/** 回傳位元遮罩而非物件：useSyncExternalStore 比的是同一性，物件每次都會是新的。 */
function getSnapshot(): number {
  const room = document.documentElement.scrollHeight - window.innerHeight;
  return (window.scrollY > THRESHOLD ? SCROLLED_BIT : 0) | (room > THRESHOLD ? SCROLLABLE_BIT : 0);
}

function getServerSnapshot(): number {
  return 0;
}

/** 這一頁夠長、值得提供回頁首入口（不管目前捲到哪裡）。 */
export function usePageScrollable(): boolean {
  return (useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) & SCROLLABLE_BIT) !== 0;
}

/** 捲回最上方，並把焦點交回主內容區，讀螢幕軟體才會跟著跳回去。 */
export function scrollToTop() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  document.getElementById("main-content")?.focus({ preventScroll: true });
}

export default function BackToTop() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (state !== (SCROLLED_BIT | SCROLLABLE_BIT)) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="回到頁首"
      // 手勢列用 bottom 的 calc 讓開，不要用 .safe-bottom——那是 padding，
      // 會把這顆固定 44px 的圓鈕內容往上擠成橢圓。
      title="回到頁首"
      className="animate-fade-in-up fixed bottom-[max(1.5rem,calc(1.5rem+env(safe-area-inset-bottom)))] right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-200 transition-transform hover:scale-110 active:scale-95 print:hidden"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
