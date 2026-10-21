import { Suspense } from "react";
import WorkspaceEntry from "@/components/babycam/WorkspaceEntry";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";

export default function BabyCamPage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="17">
        {/* ⚠️ QR 掃描／媽媽端／親友端三個連結已移進工作區卡片的導覽列，角色提示也一併移除。
            原本掛在頁首 action 的那一塊會多佔整整一個 band，客戶指著它說「重複資訊，整塊拿掉」。 */}
        <PageHeader title="寶寶視訊" moduleNo="17" />

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
