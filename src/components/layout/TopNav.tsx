"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="whitespace-nowrap text-sm font-bold text-slate-800">
          聖帝諾產後護理之家
        </span>
        <span className="hidden text-xs text-slate-400 sm:inline">
          院務管理系統（靜態畫面稿）
        </span>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 pb-2 pt-1">
        {MODULES.map((m) => {
          const active =
            m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
          return (
            <Link
              key={m.no}
              href={m.href}
              className={
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors " +
                (active
                  ? "bg-rose-500 text-white"
                  : "text-slate-600 hover:bg-slate-100")
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
