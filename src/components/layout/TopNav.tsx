"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-sm font-bold text-white">
          聖
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-bold text-slate-800">聖帝諾產後護理之家</div>
          <div className="hidden truncate text-[11px] text-slate-400 sm:block">
            院務管理系統（靜態畫面稿）
          </div>
        </div>
      </div>
      <nav className="scroll-fade flex gap-1.5 overflow-x-auto border-t border-slate-100 px-3 pb-2.5 pt-1.5 sm:px-5">
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
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200")
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
