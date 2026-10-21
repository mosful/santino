"use client";

import { useSearchParams } from "next/navigation";
import BabycamWorkspace from "./BabycamWorkspace";

/**
 * 掃描嬰兒車／手圈標籤後的落地頁。
 *
 * ⚠️ 帶著 `?code=` 進來就直接落在「掃碼歸位核對」，不要再送去「寶寶登錄與標籤」：
 * 護理人員是拿著寶寶站在車旁掃碼的，落在登錄頁還要自己找到核對頁籤才能按
 * 「核對並歸位」。沒有 code（例如有人直接開這個網址）才回到登錄頁。
 */
export default function ScanEntry() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  return <BabycamWorkspace key={code} initialSection={code ? "scan" : "assign"} initialScanCode={code} />;
}
