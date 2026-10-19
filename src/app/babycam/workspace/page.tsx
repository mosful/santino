import { Suspense } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import WorkspaceEntry from "@/components/babycam/WorkspaceEntry";

/** /babycam 的同義路由：保留既有深連結（?binding=、?section=）與自動化測試的進入點。 */
export default function BabycamWorkspacePage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="17">
        <PageHeader title="17. 寶寶視訊（WebCam）" moduleNo="17" />
        <Suspense fallback={<p className="p-4 text-sm text-stone-500">載入視訊工作區…</p>}>
          <WorkspaceEntry />
        </Suspense>
      </RequireAccess>
    </div>
  );
}
