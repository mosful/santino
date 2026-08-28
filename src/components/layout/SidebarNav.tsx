"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { MODULES } from "@/lib/modules";
import { MODULE_ICONS } from "./icons";
import { useCurrentRole } from "@/lib/roleStore";
import { getAccess } from "@/lib/permissions";

export default function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const role = useCurrentRole();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {MODULES.map((m) => {
        const Icon = MODULE_ICONS[m.no];
        const active = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
        const access = getAccess(role, m.no);
        const locked = access === "none";
        const isExpanded = expanded === m.no;

        return (
          <div key={m.no}>
            <div className="flex items-stretch">
              <Link
                href={locked ? "#" : m.href}
                onClick={(e) => {
                  if (locked) {
                    e.preventDefault();
                    return;
                  }
                  if (m.subItems && !collapsed) {
                    e.preventDefault();
                    setExpanded(isExpanded ? null : m.no);
                  } else {
                    onNavigate?.();
                  }
                }}
                title={locked ? `${role} 無此模組存取權限` : m.label}
                className={
                  "group flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
                  (locked
                    ? "cursor-not-allowed text-stone-300"
                    : active
                    ? "bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-sm shadow-rose-200"
                    : "text-stone-600 hover:bg-amber-50")
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{m.label}</span>
                    {locked && <Lock className="h-3.5 w-3.5 shrink-0" />}
                    {!locked && access === "view" && (
                      <span
                        className={
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] " +
                          (active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-400")
                        }
                      >
                        唯讀
                      </span>
                    )}
                    {m.subItems && !locked && (
                      <ChevronDown
                        className={"h-3.5 w-3.5 shrink-0 transition-transform " + (isExpanded ? "rotate-180" : "")}
                      />
                    )}
                  </>
                )}
              </Link>
            </div>

            {!collapsed && m.subItems && isExpanded && !locked && (
              <div className="ml-6 flex flex-col gap-0.5 border-l border-amber-900/10 py-1 pl-3">
                {m.subItems.map((s) => (
                  <Link
                    key={s.key}
                    href={`${m.href}?tab=${s.key}`}
                    onClick={() => onNavigate?.()}
                    className="truncate rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-amber-50 hover:text-rose-600"
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
