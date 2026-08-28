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
      <div className="flex flex-wrap gap-1 border-b border-stone-200 pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={
              "-mb-px rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium transition-colors sm:px-4 " +
              (t.key === active
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-800")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{current?.content}</div>
    </div>
  );
}
