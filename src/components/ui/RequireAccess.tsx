"use client";

import { Lock } from "lucide-react";
import { useAccess } from "@/lib/roleStore";
import { useCurrentRole } from "@/lib/roleStore";

/**
 * 頁面層級的權限防呆：若目前模擬身分對此模組無存取權限，直接擋下整頁內容，
 * 避免使用者直接輸入網址繞過側邊欄的鎖定圖示。
 */
export default function RequireAccess({
  moduleNo,
  children,
}: {
  moduleNo: string;
  children: React.ReactNode;
}) {
  const access = useAccess(moduleNo);
  const role = useCurrentRole();

  if (access === "none") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 bg-white/60 p-16 text-center">
        <Lock className="h-10 w-10 text-stone-300" />
        <p className="text-sm font-medium text-stone-500">目前身分「{role}」沒有此模組的存取權限</p>
        <p className="text-xs text-stone-400">請至右上角切換身分，或洽系統管理員調整權限設定</p>
      </div>
    );
  }
  return <>{children}</>;
}
