import type { CaseRecord, SaleItem } from "./types";

/**
 * 入住後消費（自費）的分類與品項主檔。
 *
 * 來源：客戶手冊第 37 頁「入住後消費記錄」的產品分類下拉（備品-媽媽專用／備品-寶寶專用／
 * 其他備品／課程／媽媽贈品），以及第 36 頁標註「如果有自費中醫洗頭洗鬆、課程、按摩等
 * 收費要能統合計價」——後者歸在「自費服務」。
 *
 * ⚠️ 自費原本只有一個「項目／原因」文字欄，金額全靠手打，無法分類統計也無法統合計價。
 * 改成分類＋品項＋數量×單價後，品項單價由後台主檔維護，臨時項目仍可自訂。
 */

export const SALE_CATEGORIES = [
  "備品-媽媽專用",
  "備品-寶寶專用",
  "其他備品",
  "課程",
  "媽媽贈品",
  "自費服務",
] as const;
export type SaleCategory = (typeof SALE_CATEGORIES)[number];

/** 品項主檔出廠值；單價取自手冊第 20、33 頁，可於後台「基礎主檔設定」調整。 */
export const DEFAULT_SALE_ITEMS: SaleItem[] = [
  { id: "towel-l", category: "備品-媽媽專用", name: "大毛巾", price: 30 },
  { id: "towel-s", category: "備品-媽媽專用", name: "小毛巾", price: 20 },
  { id: "quilt", category: "備品-媽媽專用", name: "棉被", price: 200 },
  { id: "robe", category: "備品-媽媽專用", name: "睡袍（第 3 件起清潔費）", price: 100 },
  { id: "bottle", category: "備品-寶寶專用", name: "玻璃奶瓶", price: 150 },
  { id: "gauze", category: "備品-寶寶專用", name: "紗布衣", price: 180 },
  { id: "roomcard", category: "其他備品", name: "房卡（遺失）", price: 100 },
  { id: "lockerkey", category: "其他備品", name: "櫃子鑰匙（遺失）", price: 100 },
  { id: "thymus", category: "課程", name: "胸腺疏通", price: 1200 },
  { id: "venus", category: "課程", name: "維納斯身體雕塑", price: 1500 },
  { id: "yoga", category: "課程", name: "產後瑜珈", price: 800 },
  { id: "monalisa", category: "媽媽贈品", name: "蒙娜麗莎之吻（需訂位）", price: 0 },
  { id: "crab", category: "媽媽贈品", name: "紅蟳火鍋", price: 1200 },
  { id: "hair", category: "自費服務", name: "洗髮", price: 450 },
  { id: "tcm", category: "自費服務", name: "中醫看診", price: 800 },
  { id: "massage", category: "自費服務", name: "按摩", price: 1000 },
];

export const saleItemsOf = (items: SaleItem[], category: string) => items.filter((item) => item.category === category);

/** 帳務依分類小計（手冊第 36 頁「全部金額要能夠計算成數」的統合計價）。 */
export function ledgerByCategory(record: CaseRecord) {
  const groups = new Map<string, number>();
  for (const entry of record.ledger) {
    const key = entry.category ?? "其他費用調整";
    groups.set(key, (groups.get(key) ?? 0) + entry.amount);
  }
  return [...groups.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}
