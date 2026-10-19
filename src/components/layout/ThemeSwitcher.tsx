"use client";

import { Check, Palette } from "lucide-react";
import { THEMES, useTheme, setTheme } from "@/lib/themeStore";

export default function ThemeSwitcher() {
  const current = useTheme();
  const currentIndex = THEMES.findIndex((theme) => theme.value === current);
  const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
  return (
    <>
      <button
        type="button"
        onClick={() => setTheme(nextTheme.value)}
        aria-label={`目前為${THEMES[currentIndex]?.label ?? "暖色"}主題，切換為${nextTheme.label}主題`}
        title={`切換為${nextTheme.label}主題`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-900/10 bg-surface-raised text-brand-600 shadow-sm sm:hidden"
      >
        <Palette className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="hidden items-center gap-0.5 rounded-xl border border-brand-900/10 bg-surface-raised p-1 shadow-sm sm:flex" role="group" aria-label="介面配色">
        {THEMES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            title={t.label}
            aria-label={`切換為${t.label}主題`}
            aria-pressed={current === t.value}
            className="theme-swatch relative flex h-9 min-h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-[transform,box-shadow] hover:scale-105"
            style={{ backgroundColor: t.swatch }}
          >
            {current === t.value && <Check className="h-4 w-4 text-white drop-shadow-sm" strokeWidth={3.5} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </>
  );
}
