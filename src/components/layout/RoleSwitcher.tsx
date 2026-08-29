"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, UserCircle2 } from "lucide-react";
import { ROLES, ROLE_PROFILE } from "@/lib/permissions";
import { useCurrentRole, setCurrentRole } from "@/lib/roleStore";

export default function RoleSwitcher() {
  const role = useCurrentRole();
  const profile = ROLE_PROFILE[role];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-brand-900/10 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-brand-50"
      >
        <UserCircle2 className="h-4 w-4 text-brand-500" />
        <span>
          {profile.name}
          <span className="text-stone-400">（{profile.empNo}）</span>
          <span className="text-stone-300"> / </span>
          {role}
        </span>
        <ChevronDown className={"h-3 w-3 transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && (
        <div className="animate-fade-in-up absolute right-0 top-full z-40 mt-1.5 w-56 overflow-hidden rounded-xl border border-brand-900/10 bg-white py-1.5 shadow-lg">
          {ROLES.map((r) => {
            const p = ROLE_PROFILE[r];
            return (
              <button
                key={r}
                onClick={() => {
                  setCurrentRole(r);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-center justify-between px-4 py-2 text-left text-sm " +
                  (r === role ? "bg-brand-50 font-medium text-brand-600" : "text-stone-600 hover:bg-stone-50")
                }
              >
                <span>{r}</span>
                <span className="text-xs text-stone-400">
                  {p.name}（{p.empNo}）
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
