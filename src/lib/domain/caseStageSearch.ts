import { CASE_DOCS } from "./caseDocs";
import { CASE_STAGES } from "./types";

/**
 * 案件詳情的欄位搜尋索引：輸入關鍵字直接跳到對應階段與欄位，不必上下捲動找。
 *
 * `stage` 為 CASE_STAGES 的索引，-1 代表上方「共通資料」；`step` 是合約五步驟的子頁，
 * 跳過去時會先點開該步驟。`label` 須與畫面上的標籤文字一致（以「包含」比對定位）。
 * ⚠️ 階段內新增欄位時順手補進這裡，否則搜不到；畫面文字改了也要同步。
 */
export type StageSearchEntry = { stage: number; label: string; step?: string };

const fields = (stage: number, labels: string[], step?: string): StageSearchEntry[] => labels.map((label) => ({ stage, label, step }));

export const CASE_STAGE_INDEX: StageSearchEntry[] = [
  ...fields(-1, ["媽媽姓名", "聯絡電話", "預產期", "身分證字號", "醫院病歷號"]),
  ...fields(0, ["類別", "胎次", "生產方式", "生產醫院", "參觀日期", "參觀時段", "訊息來源", "接待人員"]),
  ...fields(1, ["參觀出席", "參觀後意向", "合約影本攜回審閱日", "參觀紀錄", "價格身分", "特約企業", "房型", "入住天數", "試吃", "覆寫金額"]),
  ...fields(2, ["下訂日期", "收字第○號（合約編號）", "訂金", "付款方式", "下訂備註"]),
  ...["基本資料", "套餐與加購", "審閱期與入住日", "簽名", "產生合約"].map((step) => ({ stage: 3, label: step, step })),
  ...fields(3, ["身分證字號", "通訊地址", "緊急聯絡人", "陪宿者", "固定訪客姓名", "24 小時親子同室", "餐飲摘要"], "基本資料"),
  ...fields(3, ["合約房型", "合約入住天數", "合約贈送天數", "贈送天數", "老闆加送品項"], "套餐與加購"),
  ...fields(3, ["簽約日", "攜回審閱日"], "審閱期與入住日"),
  ...fields(3, ["預計哺餵方式", "代簽者姓名／關係"], "簽名"),
  ...fields(4, ["入住前時間軸", "產前關懷電話", "住院與生產方式通知", "保全資訊", "入住指導單", "確認實際入住日", "實際入住日", "入住房號", "列印入住指導單"]),
  ...fields(5, ["前往帳務", "住戶諮詢", "入住當天餐飲", "餐飲人數", "餐飲內容"]),
  ...fields(6, ["已完成尾款結算", "返家指導單", "返家檢查表", "媽媽實際入住天數", "寶寶實際入住天數", "寶寶一日退費", "續留托嬰", "托嬰車號", "托嬰天數", "每日托嬰費", "接送人／聯絡方式", "返家照片"]),
  // 櫃台單據：有 stage 的跟著該階段，掛在入住前時間軸上的歸「入住前」。
  ...CASE_DOCS.map((doc) => ({ stage: doc.stage ?? 4, label: doc.label })),
];

const normalize = (value: string) => value.toLowerCase().replace(/[\s・｜/／()（）○]/g, "");

/** 模糊比對分數：連續包含最高，其次依序出現（子序列）；不符回 0。 */
export function fuzzyScore(text: string, query: string) {
  const target = normalize(text);
  const needle = normalize(query);
  if (!needle) return 0;
  const at = target.indexOf(needle);
  if (at >= 0) return 100 - at;
  let position = 0;
  for (const char of needle) {
    position = target.indexOf(char, position);
    if (position < 0) return 0;
    position += 1;
  }
  return 10;
}

/** 依分數排序的搜尋結果；階段名稱本身也搜得到（輸入「退房」直接跳到退房）。 */
export function searchCaseStages(query: string, limit = 8) {
  const entries: StageSearchEntry[] = [...CASE_STAGES.map((stage, index) => ({ stage: index, label: stage })), ...CASE_STAGE_INDEX];
  const seen = new Set<string>();
  return entries
    .map((entry) => ({ entry, score: Math.max(fuzzyScore(entry.label, query), fuzzyScore(`${CASE_STAGES[entry.stage] ?? "共通資料"}${entry.label}`, query) - 50) }))
    .filter(({ entry, score }) => score > 0 && !seen.has(`${entry.stage}-${entry.label}`) && seen.add(`${entry.stage}-${entry.label}`))
    .sort((a, b) => b.score - a.score || a.entry.stage - b.entry.stage)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
