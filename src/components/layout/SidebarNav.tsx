"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MODULES } from "@/lib/modules";
import { MODULE_ICONS } from "./icons";
import { useCurrentRole } from "@/lib/roleStore";
import { getAccess } from "@/lib/permissions";
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
      {MODULES.filter((m) => m.phase <= enabledPhase && getAccess(role, m.no) !== "none").map((m) => {
        const Icon = MODULE_ICONS[m.no];
        const active = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
        const access = getAccess(role, m.no);
        const isExpanded = expanded === m.no;
        const visibleSubItems = m.no === "1" && dashboardLayout === "journey"
          ? []
          : m.subItems?.filter((item) => (item.phase ?? m.phase) <= enabledPhase);

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
                title={collapsed ? `${m.label}（Phase ${m.phase}）` : undefined}
                className={
                  "group flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors md:max-lg:min-h-12 md:max-lg:justify-center md:max-lg:px-2 " +
                  (active
                    ? "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-sm shadow-brand-200"
                    : "text-stone-600 hover:bg-brand-50")
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{m.label}</span>
                    <span
                      className={
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] " +
                        (active ? "bg-white/20 text-white" : "bg-brand-50 text-brand-500")
                      }
                    >
                      P{m.phase}
                    </span>
                    {access === "view" && (
                      <span
                        className={
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] " +
                          (active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-400")
                        }
                      >
                        唯讀
                      </span>
                    )}
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
