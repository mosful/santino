import { Suspense } from "react";
import ScanEntry from "@/components/babycam/ScanEntry";

export default function BabycamScanPage() { return <Suspense fallback={<p className="p-6">載入掃碼核對資料…</p>}><ScanEntry /></Suspense>; }
