import { Suspense } from "react";
import WorkspaceEntry from "@/components/babycam/WorkspaceEntry";
import RequireAccess from "@/components/ui/RequireAccess";

export default function BabyCamPage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="17">
        {/* 頁首標題由 WorkspaceEntry 下（要跟著 ?section= 的群組變），這裡不要再放一個。 */}
        <Suspense fallback={<p className="p-4 text-sm text-stone-500">載入視訊工作區…</p>}>
          <WorkspaceEntry />
        </Suspense>

        <div className="mt-6 space-y-2 rounded border border-dashed border-stone-300 p-3 text-xs text-stone-400">
          <p>
            純靜態展示：影像、抓圖與繼電器均為模擬，不會連線院內設備。本模組不屬於 Phase 1／Phase 2，
            為客戶指定優先開發之獨立範圍（純開發 27 項／16.4 人天）。院內設定在本頁，媽媽端與親友端為獨立的手機版頁面，不在院務選單內。
          </p>
          <p>
            本階段不做：發信通知相關人員、截圖歷史回看、即時影像低延遲串流（HLS／WebRTC）、
            正式設備服務。案件退房與托嬰期限已連動本機展示授權。
          </p>
        </div>
      </RequireAccess>
    </div>
  );
}
