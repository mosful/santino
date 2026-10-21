"use client";

import { useEffect } from "react";
import { pageTitle } from "@/lib/usePageTitle";
import { clearPageHeading, setPageHeading } from "@/lib/pageHeadingStore";
import HeaderSlot from "@/components/layout/HeaderSlot";

/**
 * 頁面標題宣告元件。標題本身改由 AppShell 的頁首列顯示（與登入者資訊同一列），
 * 這裡只負責：設定瀏覽器分頁標題、把標題交給頁首、以及渲染頁面層級的操作按鈕。
 */
export default function PageHeader({
  title,
  action,
  moduleNo,
}: {
  title: string;
  action?: React.ReactNode;
  moduleNo?: string;
}) {
  useEffect(() => {
    setPageHeading({ title, moduleNo });
    return () => clearPageHeading(title);
  }, [title, moduleNo]);

  return (
    <>
      <title>{pageTitle(title)}</title>
      {/*
        頁面層級的操作按鈕也走頁首下方那一列（導覽第 3 層），和主頁籤同列靠右。
        ⚠️ 不要改回渲染在頁面內容裡：客戶回報「選單位置與按鈕分布太零散」，
        要求導覽統一在左邊（主選單）與上面（頁首）。
      */}
      {action && (
        <HeaderSlot slot="below">
          <div className="header-page-actions tablet-page-header-action flex flex-wrap items-center gap-2">
            {action}
          </div>
        </HeaderSlot>
      )}
    </>
  );
}
