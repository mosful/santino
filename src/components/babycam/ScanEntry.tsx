"use client";

import { useSearchParams } from "next/navigation";
import BabycamWorkspace from "./BabycamWorkspace";

export default function ScanEntry() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  return <BabycamWorkspace key={code} initialSection="assign" initialScanCode={code} />;
}
