"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import RoomStatusOverview from "@/components/dashboard/RoomStatusOverview";

/**
 * 房況總覽（模組 4）。
 *
 * ⚠️ 這裡以前沒有獨立路由：依 v24 §3，房況是「收回櫃台服務首頁」的一個區塊。
 * 但 2026-10-21 客戶要求衛教師與護理師看不到櫃台服務，而 v24 §1 又寫明這三個
 * 現場角色都能操作房況——兩條規則在護理角色身上互斥，他們會完全沒有入口。
 *
 * 因此把房況抽成獨立頁並放進第一層選單：一份資料、一個位置、一個入口，
 * 三個角色都到得了，權限直接吃模組 4 的矩陣，不必再為任何角色開特例。
 * 櫃台首頁改放一條可點的房況摘要（人數與今日進出），細節在這一頁。
 */
export default function RoomsPage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="4">
        <PageHeader title="房間動態" moduleNo="4" />
        <RoomStatusOverview />
      </RequireAccess>
    </div>
  );
}
