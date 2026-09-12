export type Role =
  | "櫃台"
  | "阿長 婉真"
  | "衛教師 琳雅"
  | "系統管理員";

export const ROLES: Role[] = [
  "櫃台",
  "阿長 婉真",
  "衛教師 琳雅",
  "系統管理員",
];

/** 各角色示意用的登入者姓名／工號（靜態畫面稿模擬登入，非真實帳號資料） */
export const ROLE_PROFILE: Record<Role, { name: string; empNo: string }> = {
  系統管理員: { name: "admin", empNo: "SYS001" },
  櫃台: { name: "櫃台人員", empNo: "F1001" },
  "阿長 婉真": { name: "婉真", empNo: "N1001" },
  "衛教師 琳雅": { name: "琳雅", empNo: "E3005" },
};

export type AccessLevel = "edit" | "view" | "none";

// 依使用者確認的四大角色，將原細分職務權限濃縮為示範矩陣。
// "系統管理員"對全模組固定為edit（示意用途，方便demo切換查看任何頁面）。
const MATRIX: Record<string, Partial<Record<Role, AccessLevel>>> = {
  "1": { 櫃台: "edit", "阿長 婉真": "view", "衛教師 琳雅": "view" },
  "2": { 櫃台: "none", "阿長 婉真": "edit", "衛教師 琳雅": "edit" },
  "3": { 櫃台: "view", "阿長 婉真": "edit", "衛教師 琳雅": "view" },
  "4": { 櫃台: "edit", "阿長 婉真": "view", "衛教師 琳雅": "none" },
  "5": { 櫃台: "edit", "阿長 婉真": "view", "衛教師 琳雅": "view" },
  "6": { 櫃台: "none", "阿長 婉真": "view", "衛教師 琳雅": "none" },
  "7": { 櫃台: "edit", "阿長 婉真": "view", "衛教師 琳雅": "view" },
  "8": { 櫃台: "none", "阿長 婉真": "edit", "衛教師 琳雅": "none" },
  "9": { 櫃台: "edit", "阿長 婉真": "view", "衛教師 琳雅": "none" },
  "10": { 櫃台: "none", "阿長 婉真": "view", "衛教師 琳雅": "none" },
  "12": { 櫃台: "edit", "阿長 婉真": "view", "衛教師 琳雅": "view" },
  "13": { 櫃台: "edit", "阿長 婉真": "none", "衛教師 琳雅": "view" },
  "14": { 櫃台: "edit", "阿長 婉真": "none", "衛教師 琳雅": "none" },
  "15": { 櫃台: "view", "阿長 婉真": "view", "衛教師 琳雅": "none" },
};

export function getAccess(role: Role, moduleNo: string): AccessLevel {
  if (role === "系統管理員") return "edit";
  return MATRIX[moduleNo]?.[role] ?? "none";
}
