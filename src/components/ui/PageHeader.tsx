"use client";

import { useEffect } from "react";
import { pageTitle } from "@/lib/usePageTitle";
import { clearPageHeading, setPageHeading } from "@/lib/pageHeadingStore";

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
      {action && (
        <div className="tablet-page-header-action animate-fade-in-up mb-4 flex flex-wrap items-center justify-end gap-2">
          {action}
        </div>
      )}
    </>
  );
}
