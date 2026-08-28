"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MODULES } from "@/lib/modules";

export default function TopNav() {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenKey(null);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const MENU_WIDTH = 224; // 對應 w-56

  function openMenuFor(key: string, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const left = Math.min(rect.left, window.innerWidth - MENU_WIDTH - 12);
    setMenuPos({ top: rect.bottom + 6, left: Math.max(12, left) });
    setOpenKey(key);
  }

  const activeModule = MODULES.find((m) => m.no === openKey);

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-amber-900/10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="flex items-center gap-3 px-4 py-2 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 text-sm font-bold text-white shadow-sm">
            聖
          </div>
          <div className="hidden min-w-0 leading-tight md:block">
            <div className="truncate text-sm font-bold text-stone-800">聖帝諾產後護理之家</div>
            <div className="truncate text-[11px] text-stone-400">院務管理系統（靜態畫面稿）</div>
          </div>
        </Link>

        <nav
          ref={navRef}
          onMouseLeave={() => setOpenKey(null)}
          className="scroll-fade flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
        >
          {MODULES.map((m) => {
            const active = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
            const isOpen = openKey === m.no;
            return (
              <Link
                key={m.no}
                href={m.href}
                onMouseEnter={(e) => m.subItems && openMenuFor(m.no, e.currentTarget)}
                onClick={(e) => {
                  if (m.subItems) {
                    e.preventDefault();
                    // 固定為「開啟」而非切換：觸控裝置常先觸發hover(mouseenter)再click，
                    // 若用toggle會被click立刻關掉剛因hover打開的選單。關閉交給
                    // mouseleave／點外部／Esc／點子選單項目處理。
                    openMenuFor(m.no, e.currentTarget);
                  }
                }}
                className={
                  "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all " +
                  (active
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-200"
                    : isOpen
                    ? "bg-amber-50 text-rose-600"
                    : "text-stone-600 hover:bg-stone-100 active:bg-stone-200")
                }
              >
                {m.label}
                {m.subItems && (
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={"h-3.5 w-3.5 transition-transform " + (isOpen ? "rotate-180" : "")}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {activeModule?.subItems &&
        menuPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onMouseEnter={() => setOpenKey(activeModule.no)}
            onMouseLeave={() => setOpenKey(null)}
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-40 w-56 overflow-hidden rounded-xl border border-amber-900/10 bg-white py-1.5 shadow-lg"
          >
            {activeModule.subItems.map((s) => (
              <Link
                key={s.key}
                href={`${activeModule.href}?tab=${s.key}`}
                onClick={() => setOpenKey(null)}
                className="block px-4 py-2 text-sm text-stone-600 hover:bg-amber-50 hover:text-rose-600"
              >
                {s.label}
              </Link>
            ))}
          </div>,
          document.body
        )}
    </header>
  );
}
