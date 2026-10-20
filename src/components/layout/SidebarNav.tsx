"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MODULES } from "@/lib/modules";
import { MODULE_ICONS } from "./icons";
import { useCurrentRole } from "@/lib/roleStore";
import { canEditAdminSetting, getAccess } from "@/lib/permissions";
import { useEnabledPhase } from "@/lib/phaseStore";
import { useDashboardLayout } from "@/lib/dashboardLayoutStore";

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
  const dashboardLayout = useDashboardLayout();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {MODULES.filter((m) => m.showInSidebar !== false && m.phase <= enabledPhase && getAccess(role, m.no) !== "none").map((m) => {
        const Icon = MODULE_ICONS[m.no];
        // 以路徑分段為界判斷，避免 /babycam 讓 /baby 也被判定為選取中；
        // 同時相容 trailingSlash:true 產生的 "/baby/" 形式。
        const active =
          m.href === "/"
            ? pathname === "/"
            : pathname === m.href || pathname.startsWith(m.href + "/");
        const isExpanded = expanded === m.no;
        // 子項過濾：未開放的分期不列；後台「系統設定」類（🔒）只有管理者看得到——
        // 依客戶要求，沒有權限的項目直接不出現在選單，不做「看得到但不能改」。
        const visibleSubItems = m.no === "1" && dashboardLayout === "journey"
          ? []
          : m.subItems?.filter(
              (item) =>
                (item.phase ?? m.phase) <= enabledPhase &&
                (!item.adminGroup || canEditAdminSetting(role, item.adminGroup)),
            );

        return (
          <div key={m.no}>
            <div className="flex items-stretch">
              <Link
                href={m.href}
                onClick={(e) => {
                  if (visibleSubItems?.length && !collapsed) {
                    e.preventDefault();
                    setExpanded(isExpanded ? null : m.no);
                  } else {
                    onNavigate?.();
                  }
                }}
                title={collapsed ? m.label : undefined}
                className={
                  "group flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors md:max-lg:min-h-12 md:max-lg:justify-center md:max-lg:px-2 " +
                  (active
                    ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm shadow-brand-200"
                    : "text-stone-600 hover:bg-brand-50")
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{m.label}</span>
                    {!!visibleSubItems?.length && (
                      <ChevronDown
                        className={"h-3.5 w-3.5 shrink-0 transition-transform " + (isExpanded ? "rotate-180" : "")}
                      />
                    )}
                  </>
                )}
              </Link>
            </div>

            {!collapsed && !!visibleSubItems?.length && isExpanded && (
              <div className="ml-6 flex flex-col gap-0.5 border-l border-brand-900/10 py-1 pl-3">
                {visibleSubItems.map((s) => (
                  <Link
                    key={s.key}
                    href={`${m.href}?tab=${s.key}`}
                    onClick={() => onNavigate?.()}
                    className="truncate rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
