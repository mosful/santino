"use client";

import { Lock } from "lucide-react";
import { ButtonLink } from "./Button";
import { useAccess } from "@/lib/roleStore";
import { useCurrentRole } from "@/lib/roleStore";

/**
 * 頁面層級的權限防呆。
 *
 * 側邊欄已把沒有權限的模組整項拿掉（不是顯示後改唯讀），這裡擋的是「直接打網址」
 * 的情況：依 v24 §1，無權限的網址一律導向「此功能不在○○的權限範圍」頁。
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
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-surface-raised/70 p-12 text-center sm:p-16">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="text-base font-semibold text-stone-700">此功能不在「{role}」的權限範圍</p>
        <p className="text-sm leading-6 text-stone-500">
          左側選單只會列出目前身分可以操作的功能，這個網址是直接輸入或由舊連結進來的。
          <br />
          需要使用請洽管理者調整權限，或由右上角切換模擬身分。
        </p>
        <ButtonLink href="/" variant="secondary" size="sm">回到首頁</ButtonLink>
      </div>
    );
  }
  return <>{children}</>;
}
