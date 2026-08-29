"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SidebarNav from "./SidebarNav";
import RoleSwitcher from "./RoleSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import SidebarIllustration from "./SidebarIllustration";
import { useSidebarCollapsed, setSidebarCollapsed } from "@/lib/sidebarStore";

const AUTH_ROUTE_PREFIXES = ["/login", "/forgot-password"];

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
  const collapsed = useSidebarCollapsed();
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full">
      {/* 桌機固定側邊欄 */}
      <aside
        className={
          "scroll-fade sticky top-0 hidden h-screen shrink-0 overflow-y-auto border-r border-brand-900/10 bg-white/80 backdrop-blur lg:flex lg:flex-col " +
          (collapsed ? "w-[68px]" : "w-60")
        }
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 pt-2">
            <Brand compact />
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              aria-label="展開選單"
              title="展開選單"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="min-w-0 flex-1">
              <Brand />
            </div>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              aria-label="收合選單"
              title="收合選單"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        )}
        <SidebarNav collapsed={collapsed} />
        {!collapsed && <SidebarIllustration />}
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
