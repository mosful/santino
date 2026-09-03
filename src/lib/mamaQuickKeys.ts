import type { QuickKey } from "@/lib/quickKeys";

// 對照系統功能清單v17「開發優先順序」欄：核心=Phase 1，其餘=Phase 2
export const MAMA_QUICK_KEYS: QuickKey[] = [
  { key: "admission", label: "入住評估", core: true },
  { key: "ongoing", label: "持續護理", core: true },
  { key: "record", label: "媽媽護理紀錄", core: true },
  { key: "pumping", label: "擠奶紀錄", core: false },
  { key: "handover", label: "交班單", core: false },
  { key: "family", label: "家庭功能", core: false },
  { key: "social", label: "社會支持", core: true },
  { key: "mood", label: "心情量表", core: true },
  { key: "diary", label: "媽媽日記", core: false },
  { key: "doctor", label: "醫師巡診", core: false },
  { key: "discharge-eval", label: "退住評估", core: false },
  { key: "guidance", label: "護理指導單", core: true, hasSignature: true },
  { key: "fall-risk", label: "高危險跌倒評估", core: false },
  { key: "consent", label: "同意書", core: false, hasSignature: true },
  { key: "incident", label: "意外通報", core: false },
  { key: "health-edu-eval", label: "衛教認知評估單", core: false },
];
