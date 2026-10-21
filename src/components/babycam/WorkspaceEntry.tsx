"use client";

import { useSearchParams } from "next/navigation";
import BabycamWorkspace, { babycamGroupLabel } from "./BabycamWorkspace";
import PageHeader from "@/components/ui/PageHeader";

/**
 * 工作區進入點。
 *
 * ⚠️ `key` 只綁 `?binding=`，**不要把 section 放進 key**：左側選單的四個群組就是
 * 靠改 `?section=` 切換的，放進 key 會讓整個工作區 remount，使用者先前選好的
 * 案件（bindingId）與未送出的輸入全部重來。section 由 BabycamWorkspace 自己
 * 推導群組，不需要 remount。
 */
export default function WorkspaceEntry() {
  const params = useSearchParams();
  const bindingId = params.get("binding") ?? "";
  const section = params.get("section") ?? "registration";
  /*
    ⚠️ 頁首標題在這裡下，不在 page.tsx：標題要跟著左側第 2 層選單（?section=）變，
    而只有這裡讀得到 section。page.tsx 若也放一個 PageHeader，兩個會互相覆蓋。
  */
  const group = babycamGroupLabel(section);
  return (
    <>
      <PageHeader title={group ? `寶寶視訊・${group}` : "寶寶視訊"} moduleNo="17" />
      <BabycamWorkspace key={bindingId} initialBindingId={bindingId} initialSection={section} />
    </>
  );
}
