"use client";

import { Check } from "lucide-react";
import { THEMES, useTheme, setTheme } from "@/lib/themeStore";

export default function ThemeSwitcher() {
  const current = useTheme();
  return (
    <div className="flex items-center gap-1 rounded-full border border-brand-900/10 bg-white px-2 py-1.5 shadow-sm">
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          aria-label={`切換為${t.label}主題`}
          className="relative flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110"
          style={{ backgroundColor: t.swatch }}
        >
          {current === t.value && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}
