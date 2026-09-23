import Link from "next/link";
import { ExternalLink } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import CamMaster from "./tabs/CamMaster";
import CamBinding from "./tabs/CamBinding";
import CamSchedule from "./tabs/CamSchedule";
import CamQrcode from "./tabs/CamQrcode";
import CamMonitor from "./tabs/CamMonitor";

export default function BabyCamPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="17">
        <PageHeader
          title="17. 寶寶視訊（WebCam）"
          moduleNo="17"
          action={
            <div className="flex gap-2">
              <Link
                href="/view/mama"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                媽媽端畫面
              </Link>
              <Link
                href="/view/family"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                親友端畫面
              </Link>
            </div>
          }
        />

        <TabsFromUrl
          tabs={[
            { key: "master", label: "後台設定檔", content: <CamMaster /> },
            { key: "binding", label: "監視器與房號綁定", content: <CamBinding /> },
            { key: "schedule", label: "開放時段與狀態", content: <CamSchedule /> },
            { key: "qrcode", label: "QRCode 資訊卡", content: <CamQrcode /> },
            { key: "monitor", label: "監控面板", content: <CamMonitor /> },
          ]}
        />

        <div className="mt-6 space-y-2 rounded border border-dashed border-stone-300 p-3 text-xs text-stone-400">
          <p>
            本模組不屬於 Phase 1／Phase 2，為客戶指定優先開發之獨立範圍（純開發 27 項／16.4
            人天）。院內設定在本頁，媽媽端與親友端為獨立的手機版頁面，不在院務選單內。
          </p>
          <p>
            本階段不做：發信通知相關人員、截圖歷史回看、即時影像低延遲串流（HLS／WebRTC）、
            合約退住自動連動有效期限。
          </p>
        </div>
      </RequireAccess>
    </div>
  );
}
