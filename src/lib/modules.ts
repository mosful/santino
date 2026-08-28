export type SubItem = {
  key: string;
  label: string;
};

export type ModuleInfo = {
  no: string;
  label: string;
  href: string;
  subItems?: SubItem[];
};

// 15 大模組導覽（不含11更多功能歷史指標與16第二階段擴充功能，兩者不列入本階段）
// subItems 對應各模組頁面內 Tabs 的 key/label，用於選單多層下拉；
// 點擊子項會導向 `{href}?tab={key}`，頁面會以該key預先選取對應頁籤。
export const MODULES: ModuleInfo[] = [
  {
    no: "1",
    label: "中控中心",
    href: "/",
    subItems: [
      { key: "board", label: "公佈欄" },
      { key: "mama-cal", label: "媽媽行事曆" },
      { key: "internal-cal", label: "內部行事曆" },
      { key: "course", label: "課程管理" },
      { key: "value-added", label: "加值服務" },
    ],
  },
  { no: "2", label: "媽媽照護", href: "/mama" },
  { no: "3", label: "寶寶照護", href: "/baby" },
  { no: "4", label: "房間動態", href: "/room" },
  { no: "5", label: "客戶資料", href: "/customer" },
  {
    no: "6",
    label: "醫師巡診",
    href: "/doctor",
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
    subItems: [
      { key: "staff", label: "員工資料" },
      { key: "permission", label: "權限設定" },
    ],
  },
  {
    no: "12",
    label: "合約管理",
    href: "/contract",
    subItems: [
      { key: "list", label: "合約查詢與列表" },
      { key: "new", label: "新增合約" },
      { key: "terms", label: "合約條款檢視" },
      { key: "templates", label: "合約範本管理" },
      { key: "renewal", label: "續約管理" },
      { key: "termination", label: "退約／作廢管理" },
      { key: "sign-status", label: "合約簽署狀態總覽" },
      { key: "change-order", label: "合約變更單" },
    ],
  },
  {
    no: "13",
    label: "課程管理",
    href: "/course",
    subItems: [
      { key: "calendar", label: "前台課程月曆" },
      { key: "venue", label: "媽媽教室場地管理" },
      { key: "lecturer", label: "課程講師資料管理" },
      { key: "registration", label: "課程與報名管理" },
      { key: "activity", label: "課程活動管理" },
      { key: "checkin", label: "報名名單與簽到" },
      { key: "fee", label: "課程收費與退費設定" },
      { key: "notify", label: "課程通知設定" },
    ],
  },
  {
    no: "14",
    label: "LINE官方帳號管理",
    href: "/line",
    subItems: [
      { key: "friends", label: "好友管理" },
      { key: "binding", label: "會員LINE綁定管理" },
      { key: "broadcast", label: "群發訊息" },
      { key: "course-notify", label: "課程通知" },
      { key: "stats", label: "訊息發送成效統計" },
    ],
  },
  {
    no: "15",
    label: "後台管理",
    href: "/admin",
    subItems: [
      { key: "visit", label: "預約參觀管理" },
      { key: "contract-data", label: "客戶及簽約資料" },
      { key: "nursing-data", label: "護理紀錄資料" },
      { key: "postpartum-report", label: "產後報表查詢" },
      { key: "accounting-report", label: "帳務報表查詢" },
      { key: "supply", label: "備品庫存管理" },
      { key: "room-data", label: "房間資料管理" },
      { key: "board", label: "公佈欄設定" },
      { key: "other", label: "產後其他設定" },
      { key: "system", label: "系統參數設定" },
      { key: "phrases", label: "常用語／片語庫設定" },
    ],
  },
];
