"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Tabs, { type TabItem } from "./Tabs";

function Inner({ tabs, deepLinkTabs }: { tabs: TabItem[]; deepLinkTabs: TabItem[] }) {
  const params = useSearchParams();
  const tab = params.get("tab") ?? undefined;
  // 已下架的頁籤平常不列，只有在網址指名它時才補上（見 deepLinkTabs 說明）。
  const extra = tab ? deepLinkTabs.filter((item) => item.key === tab) : [];
  return <Tabs key={tab ?? "__default"} defaultKey={tab} tabs={[...tabs, ...extra]} inHeader />;
}

/**
 * 與 Tabs 相同，但會讀取網址 `?tab=xxx` 決定預設頁籤，
 * 讓深連結可以直接指向對應頁籤（見 lib/modules.ts）。
 *
 * `deepLinkTabs` 是「不列在頁籤列、但允許用網址直達」的頁籤。
 * 用於客戶要求暫時隱藏、內部 DEMO 仍需操作的項目（例如後台的系統參數設定）。
 */
export default function TabsFromUrl({
  tabs,
  deepLinkTabs = [],
}: {
  tabs: TabItem[];
  deepLinkTabs?: TabItem[];
}) {
  return (
    <Suspense fallback={<Tabs tabs={tabs} inHeader />}>
      <Inner tabs={tabs} deepLinkTabs={deepLinkTabs} />
    </Suspense>
  );
}
