"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MODULES, type ModuleInfo } from "@/lib/modules";
import { MODULE_ICONS, SUB_ICONS } from "./icons";
import { useCurrentRole } from "@/lib/roleStore";
import { canUseCaseFlow, getAccess, type Role } from "@/lib/permissions";
import { useEnabledPhase, type EnabledPhase } from "@/lib/phaseStore";
import { useDomainStore } from "@/lib/demo/domainStore";
import { babycamSectionAllowed } from "@/lib/babycam/actions";
import type { DemoDomain } from "@/lib/domain/types";

/**
 * 主選單（導覽的第 1、2 層）。
 *
 * ⚠️ 第二層**只放獨立路由**（`SubItem.href`），不放頁內頁籤。
 * 曾經每個模組都能展開 2～12 個子項，而子項點下去只是切換該頁面的頁籤——
 * 同一個畫面同時掛在選單與頁籤，選單樹膨脹到約 40 項，客戶回報「入口太多」。
 * 頁內頁籤改走導覽第 3 層（頁首下方那一列），不要再塞回這裡。
 *
 * 要改選單內容請改 `lib/modules.ts`，不要在這裡另寫一份清單。
 */
function subLinksOf(module: ModuleInfo, role: Role, enabledPhase: EnabledPhase, domain: DemoDomain) {
  return (module.subItems ?? []).filter(
    (item) =>
      item.href &&
      !item.hidden &&
      (item.phase ?? module.phase) <= enabledPhase &&
      (!item.moduleNo || getAccess(role, item.moduleNo) !== "none") &&
      (!item.requiresCaseFlow || canUseCaseFlow(role)) &&
      /*
        寶寶視訊的四個群組各有自己的分段權限，護理師看不到 08 系統設定。
        ⚠️ 用 babycamSectionAllowed（角色由參數傳入），不要用 canBabycamSection——
        後者自己去讀 getCurrentRole()，hydration 當下會和 useCurrentRole() 給的角色
        不一致，畫面對不起來就是 React #418 hydration failed。
      */
      (!item.babycamSection || babycamSectionAllowed(domain, role, item.babycamSection)),
  );
}

export default function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const role = useCurrentRole();
  const enabledPhase = useEnabledPhase();
  const { data: domain } = useDomainStore();
  // 有第二層的模組預設展開：這些項目原本是首頁上方一眼可見的常用功能，
  // 收起來等於又把它們藏了一層。
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const visibleModules = MODULES.filter(
    (m) => m.showInSidebar !== false && m.phase <= enabledPhase && getAccess(role, m.no) !== "none",
  );

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {visibleModules.map((m) => {
        const Icon = MODULE_ICONS[m.no];
        // 以路徑分段為界判斷，避免 /babycam 讓 /baby 也被判定為選取中；
        // 同時相容 trailingSlash:true 產生的 "/baby/" 形式。
        /*
          比對選取狀態，只看 pathname（以分段為界，避免 /babycam 讓 /baby 也選取）。

          ⚠️ 刻意不比對 query：寶寶視訊四個群組的 href 只差 `?section=`，要分辨
          得用 `useSearchParams`，而那會強制整個側邊欄需要 Suspense 邊界——靜態匯出
          下會先渲染 fallback 再補上，選單每次換頁都閃一下。群組在哪，由工作區
          頁籤列左邊的群組名顯示（見 BabycamWorkspace）。
        */
        const isPath = (href: string) => {
          const base = href.split("?")[0].replace(/\/$/, "") || "/";
          return base === "/" ? pathname === "/" : pathname === base || pathname.startsWith(base + "/");
        };
        const subLinks = collapsed ? [] : subLinksOf(m, role, enabledPhase, domain);
        const open = !collapsedGroups.includes(m.no);
        const active = isPath(m.href) || subLinks.some((item) => isPath(item.href!));

        return (
          <div key={m.no}>
            <div className="flex items-stretch gap-0.5">
              <Link
                href={m.href}
                onClick={() => onNavigate?.()}
                title={collapsed ? m.label : undefined}
                className={
                  "group flex flex-1 rounded-xl text-sm font-medium transition-colors " +
                  // 收合時是直排的圖示＋名稱：觸控裝置看不到 title 提示，只有圖示認不出是哪個模組。
                  (collapsed ? "flex-col items-center gap-1 px-1 py-2 text-[10px] leading-tight" : "items-center gap-3 px-3 py-2.5") +
                  " " +
                  (isPath(m.href)
                    ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm shadow-brand-200"
                    : active
                      ? "bg-brand-50 text-brand-700"
                      : "text-stone-600 hover:bg-brand-50")
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className={collapsed ? "line-clamp-2 w-full text-center" : "flex-1 truncate"}>{m.label}</span>
              </Link>
              {/*
                展開鈕與主連結分開：父項本身也是一個頁面（櫃台服務＝首頁），
                把它改成「點了只展開不導航」會讓首頁進不去。
              */}
              {!!subLinks.length && (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={`${open ? "收合" : "展開"}${m.label}的功能`}
                  onClick={() =>
                    setCollapsedGroups((items) =>
                      items.includes(m.no) ? items.filter((item) => item !== m.no) : [...items, m.no],
                    )
                  }
                  className="flex w-8 shrink-0 items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                >
                  <ChevronDown className={"h-4 w-4 transition-transform " + (open ? "" : "-rotate-90")} />
                </button>
              )}
            </div>

            {!!subLinks.length && open && (
              <div className="ml-6 flex flex-col gap-0.5 border-l border-brand-900/10 py-1 pl-3">
                {subLinks.map((item) => {
                  const ambiguous = subLinks.filter((other) => isPath(other.href!)).length > 1;
                  const SubIcon = item.iconKey ? SUB_ICONS[item.iconKey] : undefined;
                  return (
                    <Link
                      key={item.key}
                      href={item.href!}
                      onClick={() => onNavigate?.()}
                      className={
                        // 同一個 pathname 下有多個子項時（寶寶視訊四個群組）一律不高亮，
                        // 否則四個會同時亮起來，比沒有提示更糟。
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors " +
                        (!ambiguous && isPath(item.href!)
                          ? "bg-brand-100 font-semibold text-brand-700"
                          : "text-stone-500 hover:bg-brand-50 hover:text-brand-600")
                      }
                    >
                      {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
