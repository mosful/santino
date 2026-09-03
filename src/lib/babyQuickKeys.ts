import type { QuickKey } from "@/lib/quickKeys";

export const BABY_QUICK_KEYS: QuickKey[] = [
  { key: "admission", label: "入住評估", core: true },
  { key: "record", label: "寶寶護理紀錄", core: true },
  { key: "daily", label: "每日照護", core: true },
  { key: "rooming", label: "親子同室", core: false },
  { key: "handover", label: "交班單", core: false },
  { key: "feeding", label: "哺餵母乳評估", core: true },
  { key: "growth", label: "成長日記", core: true },
  { key: "doctor", label: "醫師巡診", core: false },
  { key: "discharge-eval", label: "退住評估", core: false },
  { key: "photo", label: "寶寶身體照片", core: true },
  { key: "consent", label: "同意書", core: false, hasSignature: true },
  { key: "outing", label: "寶寶外出", core: false },
  { key: "io", label: "I/O", core: true },
  { key: "guidance", label: "護理指導單", core: true, hasSignature: true },
  { key: "video-record", label: "寶寶視訊紀錄", core: false },
  { key: "incident", label: "意外通報", core: false },
];
