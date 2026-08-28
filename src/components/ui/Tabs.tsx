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
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={
              "rounded-t-md px-4 py-2 text-sm font-medium transition-colors " +
              (t.key === active
                ? "border-b-2 border-rose-500 text-rose-600"
                : "text-slate-500 hover:text-slate-800")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">{current?.content}</div>
    </div>
  );
}
