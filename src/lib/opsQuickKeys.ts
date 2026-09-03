import type { QuickKey } from "@/lib/quickKeys";

// 房務版房卡無核心／次要之分，8 項皆視為核心，作業視窗一律列出全部頁籤
export const OPS_QUICK_KEYS: QuickKey[] = [
  { key: "prep", label: "入住準備", core: true },
  { key: "extend", label: "延長提前換房", core: true },
  { key: "outing", label: "媽媽外出", core: true },
  { key: "complaint", label: "媽媽客訴", core: true },
  { key: "visitor", label: "訪客資料", core: true },
  { key: "companion", label: "陪宿者資料", core: true },
  { key: "baby-video", label: "寶寶視訊單", core: true },
  { key: "id-photo", label: "證件照片", core: true },
];
