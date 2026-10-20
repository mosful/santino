"use client";

import { useState, type ReactNode } from "react";

export type TabItem = {
  key: string;
  label: string;
  content: ReactNode;
};

export default function Tabs({
  tabs,
  defaultKey,
}: {
  tabs: TabItem[];
  defaultKey?: string;
}) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div role="tablist" aria-label="內容分頁" className="tablet-tabs scroll-fade flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-surface-muted p-1 md:max-lg:flex-nowrap md:max-lg:pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            type="button"
            role="tab"
            aria-selected={t.key === active}
            aria-controls={`tab-panel-${t.key}`}
            className={
              "shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-[color,background-color,box-shadow] sm:px-4 " +
              (t.key === active
                ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm shadow-brand-200"
                : "text-stone-600 hover:bg-surface-raised hover:text-brand-700 hover:shadow-2xs")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id={`tab-panel-${current?.key}`} role="tabpanel" key={current?.key} className="animate-fade-in pt-5">
        {current?.content}
      </div>
    </div>
  );
}
