"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import JourneyDashboard from "@/components/dashboard/JourneyDashboard";
import { canUseCaseFlow } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/roleStore";

/**
 * 系統首頁（模組 1 櫃台服務）。
 *
 * ⚠️ 這裡以前有第二套首頁：classic（原中控）版型，由後台「系統參數設定」切換，
 * 內含公佈欄／媽媽行事曆／內部行事曆／課程管理／加值服務五個頁籤。
 * 那是整套影子 UI——公告已在下方「最新公告」區塊、行事曆由「待辦事項」承接、
 * 課程有獨立模組，加值服務與內部行事曆則是空殼。客戶回報「介面太複雜」，
 * 2026-10-21 整組移除，首頁只剩一種長相。不要再加回第二種版型。
 */
export default function HomePage() {
  const role = useCurrentRole();

  return (
    <div className="page-frame">
      <RequireAccess moduleNo="1">
        <PageHeader title={canUseCaseFlow(role) ? "櫃台服務" : "首頁・房況"} moduleNo="1" />
        <JourneyDashboard />
      </RequireAccess>
    </div>
  );
}
