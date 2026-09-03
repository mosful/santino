"use client";

import { useState, type ReactNode } from "react";
import { PenLine } from "lucide-react";
import type { QuickKey } from "@/lib/quickKeys";

export type CareTabItem = QuickKey & { content: ReactNode };

export type CareAccent = "rose" | "sky" | "teal";

// 選中態色系：對應媽媽照護(rose)／寶寶照護(sky)／房間動態(teal)三頁既有主色
const ACCENT_ACTIVE: Record<CareAccent, string> = {
  rose: "bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-sm shadow-rose-200",
  sky: "bg-gradient-to-r from-sky-500 to-sky-400 text-white shadow-sm shadow-sky-200",
  teal: "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-sm shadow-teal-200",
};

// 頁籤列底色帶 accent 淡色，與表單內層 Tabs 的中性灰底(bg-stone-100/70)區隔出層級，
// 避免「作業頁籤」與「表單內分頁」兩層外觀相同而混淆。
const ACCENT_BAR: Record<CareAccent, string> = {
  rose: "bg-rose-100",
  sky: "bg-sky-100",
  teal: "bg-teal-100",
};

/**
 * 房卡作業面板頁籤（受控元件）。
 *
 * 與通用 ui/Tabs 的差異，也是不能直接重用 Tabs 的原因：
 * 1. 受控 activeKey — 切換與否由外層（useMultiWindowManager）決定，才能在切到含簽名頁籤時攔截。
 * 2. 已開啟過的頁籤保持掛載（以 display:none 隱藏而非卸載），切走再切回來輸入內容不會消失（總則#7 表單需暫存）。
 * 3. 首次點擊才掛載（lazy），16 個表單不會一次全部建立。
 */
export default function CareTabs({
  tabs,
  activeKey,
  onTabSelect,
  accent,
}: {
  tabs: CareTabItem[];
  activeKey: string;
  /** 回傳是否確實切換成功；false＝被鎖房規則攔截，該頁籤不掛載 */
  onTabSelect: (tab: CareTabItem) => boolean;
  accent: CareAccent;
}) {
  // 已掛載過的頁籤 key（保留內容用），初始為開窗時的預設頁籤
  const [mounted, setMounted] = useState<string[]>([activeKey]);

  // activeKey 可能因關閉「顯示次要功能」而不在清單中，此時退回第一個頁籤
  const current = tabs.find((t) => t.key === activeKey) ?? tabs[0];
  const currentKey = current?.key;

  function handleSelect(t: CareTabItem) {
    if (!onTabSelect(t)) return; // 被攔截：頁籤不切換、內容也不掛載
    setMounted((m) => (m.includes(t.key) ? m : [...m, t.key]));
  }

  // 這一輪要渲染的頁籤：已掛載過的，加上目前作用中的（涵蓋退回第一個頁籤的情況）
  const visibleKeys = currentKey && !mounted.includes(currentKey) ? [...mounted, currentKey] : mounted;

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-3 border-b border-stone-100 bg-white px-4 pb-2.5 pt-4">
        <div className={"scroll-fade flex gap-1 overflow-x-auto rounded-full p-1 " + ACCENT_BAR[accent]}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleSelect(t)}
              title={t.hasSignature ? "含簽名步驟，切換後將鎖定僅能操作本房間" : undefined}
              className={
                "flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-sm transition-all sm:px-4 " +
                (t.key === currentKey
                  ? "font-bold " + ACCENT_ACTIVE[accent]
                  : t.core
                  ? "font-medium text-stone-600 hover:bg-white hover:text-stone-900"
                  : "font-normal text-stone-500/80 hover:bg-white hover:text-stone-700")
              }
            >
              {t.hasSignature && <PenLine className="h-3.5 w-3.5 shrink-0 opacity-80" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tabs
        .filter((t) => visibleKeys.includes(t.key))
        .map((t) => (
          <div key={t.key} className={t.key === currentKey ? "animate-fade-in" : "hidden"}>
            {t.content}
          </div>
        ))}
    </div>
  );
}
