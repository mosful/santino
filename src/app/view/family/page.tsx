import { Suspense } from "react";
import IntegratedViewer from "@/components/babycam/IntegratedViewer";

export default function FamilyViewPage() {
  return <Suspense fallback={<p>載入觀看資料…</p>}><IntegratedViewer audience="family" /></Suspense>;
}
