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
      <div className="scroll-fade flex flex-wrap gap-1 overflow-x-auto rounded-full bg-stone-100/70 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all sm:px-4 " +
              (t.key === active
                ? "bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-sm shadow-rose-200"
                : "text-stone-500 hover:bg-white hover:text-stone-800")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={current?.key} className="animate-fade-in pt-4">
        {current?.content}
      </div>
    </div>
  );
}
