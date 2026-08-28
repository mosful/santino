export type Role =
  | "護理師"
  | "護理長"
  | "醫師"
  | "衛教師"
  | "客服人員"
  | "房務人員"
  | "餐飲組人員"
  | "人資/院長室"
  | "系統管理員";

export const ROLES: Role[] = [
  "護理師",
  "護理長",
  "醫師",
  "衛教師",
  "客服人員",
  "房務人員",
  "餐飲組人員",
  "人資/院長室",
  "系統管理員",
];

export type AccessLevel = "edit" | "view" | "none";

// 依系統開發規格文件v7各模組「角色權限」章節簡化彙整。
// "系統管理員"對全模組固定為edit（示意用途，方便demo切換查看任何頁面）。
const MATRIX: Record<string, Partial<Record<Role, AccessLevel>>> = {
  "1": { 護理師: "view", 護理長: "view", 醫師: "view", 衛教師: "view", 客服人員: "edit", 房務人員: "view", 餐飲組人員: "view", "人資/院長室": "edit" },
  "2": { 護理師: "edit", 護理長: "edit", 醫師: "view", 衛教師: "edit", 客服人員: "none", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "3": { 護理師: "edit", 護理長: "edit", 醫師: "view", 衛教師: "view", 客服人員: "view", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "4": { 護理師: "view", 護理長: "view", 醫師: "none", 衛教師: "none", 客服人員: "edit", 房務人員: "edit", 餐飲組人員: "none", "人資/院長室": "view" },
  "5": { 護理師: "view", 護理長: "view", 醫師: "none", 衛教師: "view", 客服人員: "edit", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "6": { 護理師: "view", 護理長: "view", 醫師: "edit", 衛教師: "none", 客服人員: "none", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "7": { 護理師: "view", 護理長: "view", 醫師: "none", 衛教師: "view", 客服人員: "edit", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "8": { 護理師: "edit", 護理長: "edit", 醫師: "view", 衛教師: "none", 客服人員: "none", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "9": { 護理師: "view", 護理長: "view", 醫師: "none", 衛教師: "none", 客服人員: "view", 房務人員: "none", 餐飲組人員: "edit", "人資/院長室": "view" },
  "10": { 護理師: "none", 護理長: "view", 醫師: "none", 衛教師: "none", 客服人員: "none", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "edit" },
  "12": { 護理師: "none", 護理長: "none", 醫師: "none", 衛教師: "none", 客服人員: "edit", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "13": { 護理師: "none", 護理長: "none", 醫師: "none", 衛教師: "view", 客服人員: "edit", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "14": { 護理師: "none", 護理長: "none", 醫師: "none", 衛教師: "none", 客服人員: "edit", 房務人員: "none", 餐飲組人員: "none", "人資/院長室": "view" },
  "15": { 護理師: "none", 護理長: "view", 醫師: "none", 衛教師: "none", 客服人員: "view", 房務人員: "view", 餐飲組人員: "none", "人資/院長室": "edit" },
};

export function getAccess(role: Role, moduleNo: string): AccessLevel {
  if (role === "系統管理員") return "edit";
  return MATRIX[moduleNo]?.[role] ?? "none";
}
