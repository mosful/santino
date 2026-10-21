"use client";

import { useState, type ReactNode } from "react";
import HeaderSlot from "@/components/layout/HeaderSlot";

export type TabItem = {
  key: string;
  label: string;
  content: ReactNode;
};

export default function Tabs({
  tabs,
  defaultKey,
  inHeader = false,
}: {
  tabs: TabItem[];
  defaultKey?: string;
  /**
   * 頁面的**主**頁籤請設 true：頁籤列會送進頁首下方那一列（導覽第 3 層），
   * 內容仍留在原處。客戶要求「導覽統一在左邊與上面」，頁籤不要散在頁面中間。
   * 頁面內的次級頁籤（例如後台報表裡的產後／帳務）維持 false，留在原地。
   */
  inHeader?: boolean;
}) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  const list = (
    <div
      role="tablist"
      aria-label="內容分頁"
      className={
        inHeader
          ? "header-tablist scroll-fade flex gap-1 overflow-x-auto"
          : "tablet-tabs scroll-fade flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-surface-muted p-1 md:max-lg:flex-nowrap md:max-lg:pb-2"
      }
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setActive(t.key)}
          type="button"
          role="tab"
          aria-selected={t.key === active}
          aria-controls={`tab-panel-${t.key}`}
          className={
            "shrink-0 rounded-lg font-medium transition-[color,background-color,box-shadow] " +
            (inHeader ? "px-3 py-1.5 text-xs sm:text-sm " : "px-3.5 py-1.5 text-sm sm:px-4 ") +
            (t.key === active
              ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm shadow-brand-200"
              : "text-stone-600 hover:bg-surface-raised hover:text-brand-700 hover:shadow-2xs")
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {inHeader ? <HeaderSlot slot="below">{list}</HeaderSlot> : list}
      <div id={`tab-panel-${current?.key}`} role="tabpanel" key={current?.key} className={inHeader ? "animate-fade-in" : "animate-fade-in pt-5"}>
        {current?.content}
      </div>
    </div>
  );
}
