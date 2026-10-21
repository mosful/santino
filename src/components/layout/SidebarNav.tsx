"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";
import { MODULE_ICONS } from "./icons";
import { useCurrentRole } from "@/lib/roleStore";
import { canUseCaseFlow, getAccess } from "@/lib/permissions";
import { useEnabledPhase } from "@/lib/phaseStore";

/**
 * 主選單。
 *
 * ⚠️ **只有一層，沒有子項下拉**（2026-10-21）。
 * 原本每個模組都能展開 2～12 個子項，子項點下去只是切換該頁面的頁籤——
 * 同一個畫面於是同時存在「選單子項」和「頁內頁籤」兩套入口，整個選單樹膨脹到
 * 約 40 個項目。客戶明確回報「入口太多、選單太複雜」，因此收斂為：
 * 選單一層＝一個模組，進頁後用頁籤切換。`{href}?tab={key}` 深連結仍然有效。
 *
 * 要改選單內容請改 `lib/modules.ts`，不要在這裡另寫一份清單。
 */
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

  const visibleModules = MODULES.filter(
    (m) => m.showInSidebar !== false && m.phase <= enabledPhase && getAccess(role, m.no) !== "none",
  );

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {visibleModules.map((m) => {
        const Icon = MODULE_ICONS[m.no];
        // 模組 1 對沒有櫃台案件作業權限的角色改用別名（見 modules.ts 的 altLabel）。
        const label = m.no === "1" && m.altLabel && !canUseCaseFlow(role) ? m.altLabel : m.label;
        // 以路徑分段為界判斷，避免 /babycam 讓 /baby 也被判定為選取中；
        // 同時相容 trailingSlash:true 產生的 "/baby/" 形式。
        const active =
          m.href === "/"
            ? pathname === "/"
            : pathname === m.href || pathname.startsWith(m.href + "/");

        return (
          <Link
            key={m.no}
            href={m.href}
            onClick={() => onNavigate?.()}
            title={collapsed ? label : undefined}
            className={
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors md:max-lg:min-h-12 md:max-lg:justify-center md:max-lg:px-2 " +
              (active
                ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm shadow-brand-200"
                : "text-stone-600 hover:bg-brand-50")
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="flex-1 truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
