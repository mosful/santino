"use client";

import { useSearchParams } from "next/navigation";
import BabycamWorkspace from "./BabycamWorkspace";

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
  return <BabycamWorkspace key={bindingId} initialBindingId={bindingId} initialSection={section} />;
}
