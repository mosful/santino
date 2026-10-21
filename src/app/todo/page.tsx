"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TodoWorkspace from "@/components/todo/TodoWorkspace";

/** 待辦事項（v24 §9 的待辦行事曆）。選單第一項，內容依登入角色不同。 */
export default function TodoPage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="0">
        {/* ⚠️ 不要在這裡加「開啟案件流程」之類的外連：首頁常用功能列已有，
            而且待辦清單的每一筆本來就各自連到該做的那件事。 */}
        <PageHeader title="待辦事項" moduleNo="0" />
        <TodoWorkspace />
      </RequireAccess>
    </div>
  );
}
