export type Role =
  | "櫃台"
  | "衛教師 琳雅"
  | "護理師 陳護理師"
  | "護理長 婉真"
  | "管理者";

// 顯示順序依 v24 規格 §1 的角色表（由外場到管理端）
export const ROLES: Role[] = [
  "櫃台",
  "衛教師 琳雅",
  "護理師 陳護理師",
  "護理長 婉真",
  "管理者",
];

/** 示範登入者姓名／工號，人名取自 v24 規格 §1 的角色表（非真實帳號資料） */
export const ROLE_PROFILE: Record<Role, { name: string; empNo: string }> = {
  櫃台: { name: "林小姐", empNo: "F1001" },
  "衛教師 琳雅": { name: "琳雅", empNo: "E3005" },
  "護理師 陳護理師": { name: "陳護理師", empNo: "N1002" },
  "護理長 婉真": { name: "婉真", empNo: "N1001" },
  管理者: { name: "邱家駿", empNo: "SYS001" },
};

/** 舊版角色名稱 → 現行角色，讓瀏覽器裡存的舊值不會被當成無效值丟掉。 */
export const LEGACY_ROLE_ALIASES: Record<string, Role> = {
  "阿長 婉真": "護理長 婉真",
  系統管理員: "管理者",
  護理師: "護理師 陳護理師",
  維運: "管理者",
};

export type AccessLevel = "edit" | "view" | "none";

/*
  模組權限矩陣，依 v24 規格 §1：
  - 櫃台：首頁、櫃檯作業（案件制）、房況、行事曆；案件制涵蓋客戶、合約與收費。
  - 衛教師：媽媽照護全部＋寶寶照護部分表單（實際表單由 care/rules 的 canEditCare 控管）、房況與行事曆唯讀。
  - 護理師：媽媽照護與寶寶照護全部、房況與行事曆唯讀。
  - 護理長：護理師全部＋櫃檯全部＋後台管理的營運規則類。
  - 管理者：全部，且是系統面設定的唯一修改者（見 canEditAdminSetting）。
  未列出的角色一律 none；管理者與護理長另於 getAccess 以規則處理。
*/
const MATRIX: Record<string, Partial<Record<Role, AccessLevel>>> = {
  "1": { 櫃台: "edit", "衛教師 琳雅": "view", "護理師 陳護理師": "view" },
  "2": { 櫃台: "none", "衛教師 琳雅": "edit", "護理師 陳護理師": "edit" },
  "3": { 櫃台: "none", "衛教師 琳雅": "edit", "護理師 陳護理師": "edit" },
  "4": { 櫃台: "edit", "衛教師 琳雅": "view", "護理師 陳護理師": "view" },
  "5": { 櫃台: "edit", "衛教師 琳雅": "view", "護理師 陳護理師": "none" },
  "6": { 櫃台: "none", "衛教師 琳雅": "none", "護理師 陳護理師": "view" },
  "7": { 櫃台: "edit", "衛教師 琳雅": "view", "護理師 陳護理師": "none" },
  "8": { 櫃台: "none", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "9": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "10": { 櫃台: "none", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "12": { 櫃台: "edit", "衛教師 琳雅": "view", "護理師 陳護理師": "none" },
  "13": { 櫃台: "edit", "衛教師 琳雅": "view", "護理師 陳護理師": "none" },
  "14": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "15": { 櫃台: "none", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  // 17 寶寶視訊：櫃台負責入住交付與發卡，護理角色查看狀態，衛教師不涉及
  "17": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "view" },
};

export function getAccess(role: Role, moduleNo: string): AccessLevel {
  // 管理者：全部可編輯（v24 §1）
  if (role === "管理者") return "edit";
  // 護理長：護理師全部＋櫃檯全部＋後台管理（營運規則類，細部仍由 canEditAdminSetting 控）
  if (role === "護理長 婉真") return "edit";
  return MATRIX[moduleNo]?.[role] ?? "none";
}

export type AdminSettingGroup = "system" | "operations";

/**
 * v24 §1：後台的「系統設定」類（基礎主檔、人員與權限、表單與欄位設定、QR Code 管理）
 * 只有管理者能修改；營運規則類（套餐贈品、合約版本、片語庫、資料回補、評鑑指標、公佈欄）
 * 護理長也可維護。
 */
export function canEditAdminSetting(role: Role, group: AdminSettingGroup) {
  if (role === "管理者") return true;
  return group === "operations" && role === "護理長 婉真";
}
