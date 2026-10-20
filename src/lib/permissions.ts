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

/**
 * 模組存取層級。
 *
 * ⚠️ 只有兩階，沒有「唯讀」：客戶明確要求切換帳號後不屬於該角色的功能直接隱藏，
 * 而不是進得去但改成唯讀。要做欄位級的「可看不可改」請另建規則，不要把 view 加回來。
 */
export type AccessLevel = "edit" | "none";

/*
  模組權限矩陣，依 v24 規格 §1。

  ⚠️ 本矩陣**只有 edit／none 兩種結果**，不再產生 "view"。
  客戶明確要求：切換帳號後不屬於該角色的功能要直接「不見」，而不是進得去但
  改成唯讀——唯讀入口仍會讓人以為自己該做這件事，而且 v24 §1 寫的是
  「無權限的入口不顯示、無權限的網址導向權限範圍頁」。
  若未來要回頭做「可看不可改」，請另建一張獨立的欄位級規則，不要把 view 放回這裡。

  - 櫃台：首頁、櫃檯作業（案件制，涵蓋客戶／合約／收費）、房況、行事曆、課程、月子餐、LINE。
  - 衛教師：媽媽照護＋寶寶照護（部分表單由 care/rules 的 canEditCare 控管）、房況、關懷。
  - 護理師：媽媽照護與寶寶照護全部、房況、醫師巡診、寶寶視訊的護理段。
  - 護理長：護理師全部＋櫃檯全部＋後台管理的營運規則類。
  - 管理者：全部，且是系統面設定的唯一修改者（見 canEditAdminSetting）。
  未列出的角色一律 none；管理者與護理長另於 getAccess 以規則處理。
*/
const MATRIX: Record<string, Partial<Record<Role, AccessLevel>>> = {
  // 1 櫃台服務＝系統首頁。各角色都要進得來（v24 §3 的房況總覽與需立即處理事項在這裡），
  // 首頁內容本身再依角色分流，不以模組權限擋。
  "1": { 櫃台: "edit", "衛教師 琳雅": "edit", "護理師 陳護理師": "edit" },
  "2": { 櫃台: "none", "衛教師 琳雅": "edit", "護理師 陳護理師": "edit" },
  "3": { 櫃台: "none", "衛教師 琳雅": "edit", "護理師 陳護理師": "edit" },
  // 4 房況：v24 §1 三個現場角色都可操作（狀態切換的實際授權待客戶確認，見 §13-1）。
  "4": { 櫃台: "edit", "衛教師 琳雅": "edit", "護理師 陳護理師": "edit" },
  "5": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "6": { 櫃台: "none", "衛教師 琳雅": "none", "護理師 陳護理師": "edit" },
  // 7 媽媽關懷：衛教師的待辦預設類別含「關懷／提醒」（v24 §9），故一併開放。
  "7": { 櫃台: "edit", "衛教師 琳雅": "edit", "護理師 陳護理師": "none" },
  "8": { 櫃台: "none", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "9": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "10": { 櫃台: "none", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "12": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "13": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "14": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  "15": { 櫃台: "none", "衛教師 琳雅": "none", "護理師 陳護理師": "none" },
  // 17 寶寶視訊：櫃台辦入住交付與發卡、護理師做寶寶登錄與歸位核對；衛教師不涉及。
  // 再細的分段權限由 lib/babycam/actions.ts 的 getBabycamSectionAccess 控制。
  "17": { 櫃台: "edit", "衛教師 琳雅": "none", "護理師 陳護理師": "edit" },
  // 0 待辦：v24 §9 的待辦行事曆，所有角色都有（看到的類別依角色預設篩選）。
  "0": { 櫃台: "edit", "衛教師 琳雅": "edit", "護理師 陳護理師": "edit" },
};

export function getAccess(role: Role, moduleNo: string): AccessLevel {
  // 管理者：全部可編輯（v24 §1）
  if (role === "管理者") return "edit";
  // 護理長：護理師全部＋櫃檯全部＋後台管理（營運規則類，細部仍由 canEditAdminSetting 控）
  if (role === "護理長 婉真") return "edit";
  return MATRIX[moduleNo]?.[role] ?? "none";
}

/**
 * 櫃台案件作業（案件流程、案件清單、建立預約、收費與合約異動）的操作角色。
 *
 * ⚠️ 這份清單以前散在三個地方各寫一次（CaseWorkspace 的擋頁、domainStore 的
 * canManageCases、首頁的連結），改權限時很容易只改到其中一個——結果就是
 * 選單上看得到入口、點進去卻被擋，客戶實際回報過。要改就只改這裡。
 */
const CASE_FLOW_ROLES: Role[] = ["櫃台", "護理長 婉真", "管理者"];

export function canUseCaseFlow(role: Role) {
  return CASE_FLOW_ROLES.includes(role);
}

/** 給使用者看的提示：誰可以做這件事。 */
export const CASE_FLOW_ROLE_HINT = CASE_FLOW_ROLES.join("、");

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
