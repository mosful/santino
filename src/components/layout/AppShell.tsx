"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import SidebarNav from "./SidebarNav";
import RoleSwitcher from "./RoleSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import SidebarIllustration from "./SidebarIllustration";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-400 text-sm font-bold text-white shadow-sm">
        聖
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-bold text-stone-800">聖帝諾產後護理之家</div>
          <div className="truncate text-[11px] text-stone-400">院務管理系統（靜態畫面稿）</div>
        </div>
      )}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-full">
      {/* 桌機固定側邊欄 */}
      <aside className="scroll-fade sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-brand-900/10 bg-white/80 backdrop-blur lg:flex lg:flex-col">
        <Brand />
        <SidebarNav />
        <SidebarIllustration />
      </aside>

      {/* 平板/手機：抽屜式側邊欄 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-overlay-in absolute inset-0 bg-stone-900/40" onClick={() => setDrawerOpen(false)} />
          <aside className="animate-slide-in-left scroll-fade safe-top absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100"
                aria-label="關閉選單"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-brand-900/10 bg-white/85 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 lg:hidden"
            aria-label="開啟選單"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <div className="flex-1" />
          <ThemeSwitcher />
          <RoleSwitcher />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
