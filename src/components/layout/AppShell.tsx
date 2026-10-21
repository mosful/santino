"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import SidebarNav from "./SidebarNav";
import RoleSwitcher from "./RoleSwitcher";
import SidebarIllustration from "./SidebarIllustration";
import { useSidebarCollapsed, setSidebarCollapsed } from "@/lib/sidebarStore";
import { usePageHeading } from "@/lib/pageHeadingStore";
import { MODULE_ICONS } from "./icons";
import { HEADER_INLINE_SLOT_ID, HEADER_SLOT_ID } from "./HeaderSlot";

const AUTH_ROUTE_PREFIXES = ["/login", "/forgot-password"];
// 對外觀看頁（寶寶視訊的媽媽端／親友端）給手機開，不套院務側邊欄與角色切換
const STANDALONE_ROUTE_PREFIXES = ["/view"];

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

function PageHeading() {
  const heading = usePageHeading();
  const Icon = heading?.moduleNo ? MODULE_ICONS[heading.moduleNo] : undefined;

  if (!heading) {
    // 標題由各頁的 PageHeader 於掛載後送進來；未送達前先佔住列高避免頁首跳動。
    return <span className="min-w-0 flex-1 md:flex-none" aria-hidden="true" />;
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {Icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-400 text-white shadow-xs">
          <Icon className="h-4 w-4" />
        </span>
      ) : (
        <span className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-brand-500 to-accent-400" />
      )}
      <h1 className="truncate text-base font-bold tracking-[-0.02em] text-stone-800 sm:text-lg">{heading.title}</h1>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const collapsed = useSidebarCollapsed();
  const pathname = usePathname();
  const isBareRoute = [...AUTH_ROUTE_PREFIXES, ...STANDALONE_ROUTE_PREFIXES].some((p) =>
    pathname?.startsWith(p)
  );

  if (isBareRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full">
      <a className="skip-link" href="#main-content">跳至主要內容</a>
      {/* 平板固定快捷列：保留內容寬度，同時避免每次換頁都開關抽屜 */}
      <aside className="tablet-sidebar scroll-fade sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col overflow-y-auto border-r border-brand-900/10 bg-white/85 backdrop-blur md:flex lg:hidden">
        <div className="flex justify-center pt-1">
          <Brand compact />
        </div>
        <SidebarNav collapsed />
      </aside>

      {/* 桌機固定側邊欄 */}
      <aside
        className={
          "desktop-sidebar scroll-fade sticky top-0 hidden h-screen shrink-0 overflow-y-auto border-r border-brand-900/10 bg-white/80 backdrop-blur lg:flex lg:flex-col " +
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

      {/* 手機：抽屜式側邊欄 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="animate-overlay-in absolute inset-0 min-h-0 w-full bg-stone-900/40" onClick={() => setDrawerOpen(false)} aria-label="關閉選單遮罩" />
          <aside aria-label="行動版主選單" className="animate-slide-in-left scroll-fade safe-top absolute inset-y-0 left-0 w-72 overflow-y-auto bg-surface-raised shadow-xl">
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

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* 頁首與頁面注入的第二列同屬一個 sticky 容器，一起固定在畫面上方。 */}
        <div className="safe-top sticky top-0 z-30 border-b border-brand-900/10 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <header className="flex min-h-[var(--app-header-h)] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:px-6 md:max-lg:gap-x-2 md:max-lg:px-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 md:hidden"
              aria-label="開啟選單"
            >
              <Menu className="h-5 w-5" />
            </button>
            <PageHeading />
            {/*
              頁首列內的插槽：給頁面放一行情境資訊（目前是護理工作區「正在填誰的
              表單」）。桌寬時佔住標題與角色切換之間的空白；窄螢幕 w-full＋order-last
              會讓它自動掉到第二行，不會把標題與角色切換擠爆。
              空的時候由 globals.css 的 :empty 規則收掉，其他頁面不受影響。
            */}
            <div id={HEADER_INLINE_SLOT_ID} className="order-last flex w-full min-w-0 items-center lg:order-none lg:w-auto lg:flex-1" />
            <div className="flex-1 lg:hidden" />
            <RoleSwitcher />
          </header>
          {/*
            頁面可注入的第二列工具列（見 components/layout/HeaderSlot）。
            目前用於護理工作區「開啟中的表單」分頁列——它原本擺在頁面最底下，
            填表時看不到也不會想到要捲下去切換。
          */}
          <div id={HEADER_SLOT_ID} />
        </div>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
