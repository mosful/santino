"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-amber-900/10 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/65">
      <div className="flex items-center gap-2 px-4 py-2 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 text-sm font-bold text-white shadow-sm">
          聖
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-bold text-stone-800">聖帝諾產後護理之家</div>
          <div className="hidden truncate text-[11px] text-stone-400 sm:block">
            院務管理系統（靜態畫面稿）
          </div>
        </div>
      </div>
      <nav className="scroll-fade flex gap-1.5 overflow-x-auto border-t border-stone-100 px-4 pb-2 pt-1 sm:px-6">
        {MODULES.map((m) => {
          const active = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
          return (
            <Link
              key={m.no}
              href={m.href}
              className={
                "flex shrink-0 items-center whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all " +
                (active
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-200"
                  : "text-stone-600 hover:bg-stone-100 active:bg-stone-200")
              }
            >
              {m.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
