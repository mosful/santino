import { Suspense } from "react";
import CaseWorkspace from "@/components/cases/CaseWorkspace";

export default function CasesPage() {
  return <Suspense fallback={<p className="p-6">載入案件資料…</p>}><CaseWorkspace /></Suspense>;
}
