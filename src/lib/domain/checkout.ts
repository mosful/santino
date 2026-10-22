import type { CaseRecord, CheckoutItem } from "./types";

/**
 * 退房兩張單的內容 —— 全部照客戶手冊抄，不要自己發明項目。
 *
 * - 返家檢查表＝手冊第 45 頁「住戶返家檢查表」（S-F-012），臥室 19 項＋浴室 10 項，
 *   每項勾正常／異常，異常要寫原因。
 * - 返家指導單＝手冊第 38 頁，歸還品項**帶單價**（未歸還要收錢），
 *   另有應付款項 A 黃疸照光／B 托嬰費用／C 中醫部費用／D 美髮部費用／E 其他費用。
 *
 * ⚠️ DEMO 原本自訂的 6 項（房卡歸還／遙控器鑰匙／客房備品點交／設施無損壞／垃圾已清空／
 * 冰箱已清空）兩張表都對不上，已淘汰，不要加回來。
 */

export type InspectionStatus = "正常" | "異常";
export type InspectionSection = { label: string; items: string[] };

export const INSPECTION_SECTIONS: InspectionSection[] = [
  {
    label: "臥室",
    items: [
      "門、門鎖",
      "床－枕頭",
      "床－床墊",
      "椅子－親餵椅",
      "椅子－白色餐椅",
      "桌子",
      "電話機、網路線、電視棒",
      "吹風機",
      "combi 消毒鍋（夾子、量杯）",
      "奶瓶籃",
      "電視－遙控器",
      "DVD－遙控器",
      "窗戶－羅馬簾",
      "窗戶－薄紗簾",
      "住房手冊",
      "寶貝護理檯－洗手槽",
      "寶貝護理檯－軟墊",
      "寶貝護理檯－RO 飲用水",
      "茶杯組 ×2 ＋大理石托盤",
    ],
  },
  {
    label: "浴室",
    items: [
      "洗手檯、排水塞頭",
      "洗手乳罐、漱口杯組盤",
      "免治馬桶",
      "毛巾－大毛 ×1",
      "毛巾－小毛 ×1",
      "毛巾－踏墊 ×1",
      "睡袍",
      "淋浴間－層架",
      "淋浴間－水龍頭",
      "淋浴間－瓶罐 ×2",
    ],
  },
];

export const INSPECTION_ITEMS = INSPECTION_SECTIONS.flatMap((section) => section.items);

/** 返家指導單的應付款項 A–E（手冊第 38 頁，順序與代號照抄）。 */
export const RETURN_CHARGE_FIELDS = [
  { key: "jaundice", label: "A：黃疸照光" },
  { key: "childcare", label: "B：托嬰費用" },
  { key: "chinese", label: "C：中醫部費用" },
  { key: "hair", label: "D：美髮部費用" },
  { key: "other", label: "E：其他費用" },
] as const;
export type ReturnChargeKey = (typeof RETURN_CHARGE_FIELDS)[number]["key"];

/** 返家品項主檔的出廠值；單價來自手冊第 20、38 頁，可於後台「基礎主檔設定」調整。 */
export const DEFAULT_CHECKOUT_ITEMS: CheckoutItem[] = [
  { id: "roomcard", name: "房卡", unit: "張", price: 100, defaultQty: 2 },
  { id: "bottlecard", name: "奶瓶借用卡", unit: "張", price: 200, defaultQty: 1 },
  { id: "slipper", name: "室內拖鞋", unit: "雙", price: 250, defaultQty: 1 },
  { id: "lockerkey", name: "櫃子鑰匙", unit: "個", price: 100, defaultQty: 1 },
  { id: "milkbag", name: "母乳提袋", unit: "個", price: 600, defaultQty: 1 },
];

/** 這一案每個品項實際發出／歸還幾個；沒填過就用主檔的預設發出數。 */
export function returnItemRows(record: CaseRecord, items: CheckoutItem[]) {
  return items.map((item) => {
    const current = record.returnItems?.[item.id];
    const issued = current?.issued ?? item.defaultQty;
    const returned = current?.returned ?? issued;
    const missing = Math.max(0, issued - returned);
    return { item, issued, returned, missing, amount: missing * item.price };
  });
}

/** 未歸還品項應收金額。 */
export function missingItemTotal(record: CaseRecord, items: CheckoutItem[]) {
  return returnItemRows(record, items).reduce((sum, row) => sum + row.amount, 0);
}

/** 應付款項 A–E 合計。 */
export function returnChargeTotal(record: CaseRecord) {
  const charges = record.returnCharges;
  if (!charges) return 0;
  return RETURN_CHARGE_FIELDS.reduce((sum, field) => sum + (Number(charges[field.key]) || 0), 0);
}

/** 返家指導單應收總額＝未歸還品項＋應付款項 A–E。 */
export function returnTotal(record: CaseRecord, items: CheckoutItem[]) {
  return missingItemTotal(record, items) + returnChargeTotal(record);
}

/** 返家檢查表還有幾項沒檢查；0 代表可以完成。 */
export function pendingInspection(record: CaseRecord) {
  return INSPECTION_ITEMS.filter((key) => !record.roomInspection?.[key]?.status).length;
}

/** 檢查出異常的項目，完成時要寫進案件歷程。 */
export function abnormalInspection(record: CaseRecord) {
  return INSPECTION_ITEMS.filter((key) => record.roomInspection?.[key]?.status === "異常").map(
    (key) => `${key}（${record.roomInspection?.[key]?.reason || "未填原因"}）`,
  );
}
