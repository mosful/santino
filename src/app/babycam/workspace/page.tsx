import { Suspense } from "react";
import RequireAccess from "@/components/ui/RequireAccess";
import WorkspaceEntry from "@/components/babycam/WorkspaceEntry";

/** /babycam 的同義路由：保留既有深連結（?binding=、?section=）與自動化測試的進入點。 */
export default function BabycamWorkspacePage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="17">
        {/* 頁首標題由 WorkspaceEntry 下（要跟著 ?section= 的群組變），這裡不要再放一個。 */}
        <Suspense fallback={<p className="p-4 text-sm text-stone-500">載入視訊工作區…</p>}>
          <WorkspaceEntry />
        </Suspense>
      </RequireAccess>
    </div>
  );
}
