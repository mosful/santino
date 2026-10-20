export type SubItem = {
  key: string;
  label: string;
  phase?: 1 | 2 | 3;
  /**
   * 後台管理子項的權限分群（v24 §10）。
   * "system" ＝🔒僅管理者；"operations" ＝護理長也能維護。
   * 不屬於該角色的子項**直接不顯示**（不是顯示後改唯讀），選單與頁籤同步過濾。
   */
  adminGroup?: "system" | "operations";
};

export type ModuleInfo = {
  no: string;
  label: string;
  /**
   * 沒有該模組主要作業權限時改用的名稱。
   * 模組 1 對櫃台是「櫃台服務」，對護理人員實際上只有房況與待辦，
   * 仍叫櫃台服務會讓人以為點錯地方。
   */
  altLabel?: string;
  href: string;
  /** 功能所屬階段；只控制「後台管理＞系統參數設定＞功能分期顯示」的選單分類。 */
  phase: 1 | 2 | 3;
  /** false 代表功能改由其他工作區進入；原路由、權限與深連結仍保留。 */
  showInSidebar?: boolean;
  subItems?: SubItem[];
};

// 15 大模組導覽（不含11更多功能歷史指標與16第二階段擴充功能，兩者不列入本階段）
// subItems 對應各模組頁面內 Tabs 的 key/label，用於選單多層下拉；
// 點擊子項會導向 `{href}?tab={key}`，頁面會以該key預先選取對應頁籤。
export const MODULES: ModuleInfo[] = [
  // 待辦擺在選單最上方：依 v24 §9，院內每個角色上線後第一件事都是看「今天我要處理什麼」，
  // 而非先進某個模組。內容（可處理的類別、預設篩選）依角色不同，見 lib/domain/tasks.ts。
  { no: "0", label: "待辦事項", href: "/todo", phase: 1 },
  {
    no: "1",
    label: "櫃台服務",
    altLabel: "首頁・房況",
    href: "/",
    phase: 1,
    subItems: [
      { key: "board", label: "公佈欄" },
      { key: "mama-cal", label: "媽媽行事曆" },
      { key: "internal-cal", label: "內部行事曆" },
      { key: "course", label: "課程管理" },
      { key: "value-added", label: "加值服務" },
    ],
  },
  { no: "2", label: "媽媽照護", href: "/mama", phase: 1 },
  { no: "3", label: "寶寶照護", href: "/baby", phase: 1 },
  // 房況、客戶、關懷與合約屬 Phase 1，但已整併到「櫃台服務」首頁，不再顯示獨立側邊欄入口。
  // 房況依 v24 §3 收回「櫃台服務」首頁的房況總覽，不再有獨立路由；權限代號保留給房況操作判斷。
  { no: "4", label: "房況總覽", href: "/#room-status-title", phase: 1, showInSidebar: false },
  { no: "5", label: "客戶資料", href: "/customer", phase: 1, showInSidebar: false },
  {
    no: "6",
    label: "醫師巡診",
    href: "/doctor",
    phase: 2,
    subItems: [
      { key: "obgyn", label: "婦產科" },
      { key: "pediatric", label: "兒科" },
      { key: "tcm", label: "中醫師" },
    ],
  },
  {
    no: "7",
    label: "媽媽關懷",
    href: "/care",
    phase: 1,
    showInSidebar: false,
    subItems: [
      { key: "visit", label: "參觀提醒" },
      { key: "prenatal", label: "產前關懷" },
      { key: "pre-admission", label: "入住前關懷" },
      { key: "home-return", label: "返家關懷" },
      { key: "contract-reminder", label: "簽約提醒" },
      { key: "pregnancy", label: "孕期關懷" },
    ],
  },
  {
    no: "8",
    label: "評鑑指標",
    href: "/kpi",
    phase: 2,
    subItems: [
      { key: "care", label: "照護指標" },
      { key: "infection", label: "感染指標" },
      { key: "professional", label: "專業指標" },
      { key: "safety", label: "病安指標" },
    ],
  },
  {
    no: "9",
    label: "月子餐",
    href: "/meal",
    phase: 2,
    subItems: [
      { key: "order", label: "訂餐管理系統" },
      { key: "daily", label: "每日出餐明細" },
      { key: "restriction", label: "飲食禁忌統計" },
      { key: "menu-publish", label: "菜單發佈管理" },
      { key: "menu-cycle", label: "循環菜單管理" },
      { key: "tea-cycle", label: "循環茶飲管理" },
    ],
  },
  {
    no: "10",
    label: "人事考勤",
    href: "/hr",
    phase: 2,
    subItems: [
      { key: "staff", label: "員工資料" },
      { key: "permission", label: "權限設定" },
    ],
  },
  {
    no: "12",
    label: "合約與付款",
    href: "/contract",
    phase: 1,
    showInSidebar: false,
    subItems: [
      { key: "list", label: "合約查詢與列表" },
      { key: "new", label: "新增合約" },
      { key: "terms", label: "合約條款檢視" },
      { key: "templates", label: "合約範本管理", phase: 3 },
      { key: "renewal", label: "續約管理", phase: 3 },
      { key: "termination", label: "退約／作廢管理", phase: 3 },
      { key: "sign-status", label: "合約簽署狀態總覽", phase: 3 },
      { key: "change-order", label: "合約變更單", phase: 3 },
      { key: "childcare", label: "寶寶留房／托嬰合約" },
    ],
  },
  {
    no: "13",
    label: "課程管理",
    href: "/course",
    phase: 2,
    subItems: [
      { key: "calendar", label: "前台課程月曆" },
      { key: "venue", label: "媽媽教室場地管理" },
      { key: "lecturer", label: "課程講師資料管理" },
      { key: "registration", label: "課程與報名管理" },
      { key: "activity", label: "課程活動管理" },
      { key: "checkin", label: "報名名單與簽到", phase: 3 },
      { key: "fee", label: "課程收費與退費設定", phase: 3 },
      { key: "notify", label: "課程通知設定", phase: 3 },
    ],
  },
  {
    no: "14",
    label: "LINE官方帳號管理",
    href: "/line",
    phase: 2,
    subItems: [
      { key: "friends", label: "好友管理" },
      { key: "binding", label: "會員LINE綁定管理", phase: 3 },
      { key: "broadcast", label: "群發訊息", phase: 3 },
      { key: "course-notify", label: "課程通知", phase: 3 },
      { key: "stats", label: "訊息發送成效統計", phase: 3 },
    ],
  },
  {
    no: "15",
    label: "後台管理",
    href: "/admin",
    phase: 1,
    // 項目依 v24 規格 §10。adminGroup "system" 的四項僅管理者可見（見 permissions.canEditAdminSetting）。
    // ⚠️ 標題不要再加 🔒：這些項目對沒權限的角色根本不會出現，掛鎖頭只會讓有權限的
    // 管理者誤以為「被鎖住不能改」——客戶實際回報過這個誤解。
    subItems: [
      { adminGroup: "system", key: "master", label: "基礎主檔設定" },
      { adminGroup: "system", key: "staff", label: "人員與權限" },
      { adminGroup: "system", key: "forms", label: "表單與欄位設定" },
      { adminGroup: "system", key: "qrcode", label: "QR Code 管理" },
      { adminGroup: "operations", key: "package", label: "套餐與贈品規則" },
      { adminGroup: "operations", key: "contract-version", label: "合約版本管理" },
      { adminGroup: "operations", key: "phrases", label: "片語庫管理" },
      { adminGroup: "operations", key: "backfill", label: "資料回補與例外處理" },
      { adminGroup: "operations", key: "kpi-rules", label: "評鑑指標設定" },
      { adminGroup: "operations", key: "report", label: "報表查詢" },
      { adminGroup: "operations", key: "board", label: "公佈欄設定" },
      { adminGroup: "operations", key: "system", label: "系統參數設定" },
    ],
  },
  // 寶寶視訊（WebCam）：客戶指定優先開發的獨立範圍，不屬於 Phase 1／Phase 2。
  // 頁面仍可用 /babycam 網址直達。媽媽端與親友端在 /view/mama、/view/family，
  // 屬對外頁面不列入院務選單。
  {
    no: "17",
    label: "寶寶視訊",
    href: "/babycam",
    phase: 3,
    showInSidebar: false,
    // 工作區各區段以 ?section= 深連結，不是 ?tab=；QR Code 資訊卡依 v24 §10 移至後台管理。
    subItems: [],
  },
];
