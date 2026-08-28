"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Tabs, { type TabItem } from "./Tabs";

function Inner({ tabs }: { tabs: TabItem[] }) {
  const params = useSearchParams();
  const tab = params.get("tab") ?? undefined;
  return <Tabs key={tab ?? "__default"} defaultKey={tab} tabs={tabs} />;
}

/**
 * 與 Tabs 相同，但會讀取網址 `?tab=xxx` 決定預設頁籤，
 * 讓 TopNav 的多層選單子項可以直接連到對應頁籤（見 lib/modules.ts）。
 */
export default function TabsFromUrl({ tabs }: { tabs: TabItem[] }) {
  return (
    <Suspense fallback={<Tabs tabs={tabs} />}>
      <Inner tabs={tabs} />
    </Suspense>
  );
}
