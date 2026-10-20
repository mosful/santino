"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TodoWorkspace from "@/components/todo/TodoWorkspace";
import { ButtonLink } from "@/components/ui/Button";

/** 待辦事項（v24 §9 的待辦行事曆）。選單第一項，內容依登入角色不同。 */
export default function TodoPage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="0">
        <PageHeader
          title="待辦事項"
          moduleNo="0"
          action={
            <ButtonLink href="/cases/" size="sm">
              開啟案件流程
            </ButtonLink>
          }
        />
        <TodoWorkspace />
      </RequireAccess>
    </div>
  );
}
