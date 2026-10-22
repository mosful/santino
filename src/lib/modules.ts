export type SubItem = {
  key: string;
  label: string;
  phase?: 1 | 2 | 3;
  /**
   * 暫時下架：選單與頁面頁籤都不顯示，但路由與 `?tab=` 深連結仍可直達。
   * 2026-10-21 客戶要求先隱藏後台管理大部分項目，留待規格確認後再開回。
   * 要開回只需把這個旗標拿掉，不必改任何頁面程式。
   */
  hidden?: boolean;
  /**
   * 後台管理子項的權限分群（v24 §10）。
   * "system" ＝🔒僅管理者；"operations" ＝護理長也能維護。
   * 不屬於該角色的子項**直接不顯示**（不是顯示後改唯讀），選單與頁籤同步過濾。
   */
  adminGroup?: "system" | "operations";
  /**
   * 獨立頁面的路徑。**有這個欄位的子項才會出現在側邊欄第二層**；
   * 沒有的（絕大多數）只是該頁面的頁籤，由 `{模組 href}?tab={key}` 深連結到達，
   * 不佔選單——同一個畫面同時掛在選單與頁籤曾讓選單膨脹到約 40 項。
   */
  href?: string;
  /** 側邊欄第二層的權限判定依據（模組編號）。沒有權限就不顯示。 */
  moduleNo?: string;
  /** 另外要求「櫃台案件作業」權限，見 permissions.canUseCaseFlow。 */
  requiresCaseFlow?: boolean;
  /** 另外要求寶寶視訊的分段權限（01／02／04／08），見 lib/babycam/actions。 */
  babycamSection?: string;
  /** 側邊欄第二層的圖示，對應 components/layout/icons.ts 的 SUB_ICONS。 */
  iconKey?: string;
};

export type ModuleInfo = {
  no: string;
  label: string;
  href: string;
  /** 功能所屬階段；只控制「後台管理＞系統參數設定＞功能分期顯示」的選單分類。 */
  phase: 1 | 2 | 3;
  /** false 代表功能改由其他工作區進入；原路由、權限與深連結仍保留。 */
  showInSidebar?: boolean;
  subItems?: SubItem[];
};

// 15 大模組導覽（不含11更多功能歷史指標與16第二階段擴充功能，兩者不列入本階段）
//
// ⚠️ **陣列順序＝選單順序，不等於模組編號**：待辦（0）在最前、寶寶視訊（17）緊接
// 寶寶照護（3），都是依實際使用邏輯排的。要照編號找模組請用 no 欄位搜尋。
//
// subItems 對應各模組頁面內 Tabs 的 key/label。
// ⚠️ 2026-10-21 起**側邊欄不再展開子項**：客戶回報「入口太多、選單太複雜」，
// 同一個頁面被列成 N 個選單入口（選單子項 ↔ 頁內頁籤）是最主要的來源。
// 選單一層＝一個模組，進頁後用頁籤切換；`{href}?tab={key}` 深連結仍然有效。
// 這份清單現在的用途是：①規格對照 ②後台管理的頁籤單一來源（含 hidden 過濾）。
export const MODULES: ModuleInfo[] = [
  // 待辦擺在選單最上方：依 v24 §9，院內每個角色上線後第一件事都是看「今天我要處理什麼」，
  // 而非先進某個模組。內容（可處理的類別、預設篩選）依角色不同，見 lib/domain/tasks.ts。
  { no: "0", label: "待辦事項", href: "/todo", phase: 1 },
  {
    no: "1",
    label: "櫃台服務",
    href: "/",
    phase: 1,
    /*
      側邊欄第二層＝原本首頁上方那排「櫃台常用功能」膠囊（2026-10-21 客戶要求移到選單）。

      這些都是**獨立路由**，不是頁內頁籤，所以才放進選單；房況總覽不列，
      它就在櫃台服務首頁下半部，點了只是捲動。
      每一項都接真正的權限判定，沒權限的角色連項目都不會出現。
    */
    subItems: [
      // ⚠️ 2026-10-22 客戶要求先隱藏；程式與路由都保留，網址 /quote/ 仍可直達，要開回只要拿掉 hidden。
      { key: "quote", label: "套餐速算", href: "/quote/", requiresCaseFlow: true, iconKey: "quote", hidden: true },
      { key: "cases", label: "案件清單", href: "/cases/", requiresCaseFlow: true, iconKey: "cases" },
      { key: "customer", label: "客戶資料", href: "/customer/", moduleNo: "5", iconKey: "customer" },
      // ⚠️ 2026-10-22 客戶要求先隱藏；路由 /care/ 與模組 7 的權限都保留，拿掉 hidden 就回來。
      { key: "care", label: "媽媽關懷", href: "/care/", moduleNo: "7", iconKey: "care", hidden: true },
    ],
  },
  { no: "2", label: "媽媽照護", href: "/mama", phase: 1 },
  { no: "3", label: "寶寶照護", href: "/baby", phase: 1 },
  /*
    寶寶視訊（WebCam）：客戶指定優先開發的獨立範圍。

    ⚠️ 是**第一層**選單，不要塞進「櫃台服務」底下：它同時服務櫃台（入住交付、發卡）
    與護理師（寶寶登錄、掃碼歸位），而護理師看不到櫃台服務（模組 1 對他是 none），
    掛在那底下等於讓護理師沒有入口。掛兩個地方又會讓護理長看到兩次。
    ⚠️ phase 原本是 3，純粹用來把它藏出選單（它的入口當時在首頁常用功能膠囊上）。
    膠囊已移除，這裡必須是 1 才有入口可走。分期歸類以規格文件為準，這個欄位只管選單。
    媽媽端與親友端在 /view/mama、/view/family，屬對外頁面不列入院務選單。
    工作區各區段以 ?section= 深連結，不是 ?tab=；QR Code 資訊卡依 v24 §10 移至後台管理。
  */
  {
    no: "17",
    label: "寶寶視訊",
    href: "/babycam",
    phase: 1,
    /*
      四個功能群組改掛在側邊欄第二層（2026-10-21 客戶要求），工作區內不再畫群組列。
      ⚠️ href 走既有的 `?section=`：`WorkspaceEntry` 會依它 remount 工作區，
      `BabycamWorkspace` 的 LEGACY_SECTION 再把 section 對回群組與預設頁籤，
      不需要另發明一個 group 參數。
      ⚠️ `babycamSection` 是分段權限（護理師看不到 08 系統設定），要跟著判，
      不能只看模組 17 有沒有權限——否則選單列得出來、點進去是空的。
    */
    subItems: [
      { key: "babycam-01", label: "入住登記", href: "/babycam/?section=registration", babycamSection: "01", iconKey: "babycam-01" },
      { key: "babycam-02", label: "寶寶登錄", href: "/babycam/?section=assign", babycamSection: "02", iconKey: "babycam-02" },
      // 「系統設定」已併進這一項（2026-10-21 客戶要求）；改名避免與主選單的
      // 「後台管理」（模組 15，只差臺／台）認錯。燈號三頁仍各吃 06／07／08 權限。
      { key: "babycam-04", label: "設定與維運", href: "/babycam/?section=schedule", babycamSection: "04", iconKey: "babycam-04" },
    ],
  },
  /*
    房況總覽：有獨立路由、在第一層選單。

    ⚠️ v24 §3 原本把它收進「櫃台服務」首頁當一個區塊，沒有獨立路由。但 2026-10-21
    客戶要求衛教師與護理師看不到櫃台服務，而 v24 §1 又寫三個現場角色都能操作房況——
    兩條規則在護理角色身上互斥，他們會完全沒有入口。抽成獨立頁後一份資料、一個位置、
    一個入口，權限直接吃模組 4 的矩陣。櫃台首頁改放一條可點的房況摘要。
  */
  { no: "4", label: "房間動態", href: "/rooms", phase: 1 },
  // 客戶資料與媽媽關懷是「櫃台服務」的第二層（見模組 1 的 subItems），不另列第一層。
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
    //
    // ⚠️ 合約作業的主線在「案件流程」，這一頁只做案件做不到的事：查舊約、看條款、
    // 托嬰另立合約。客戶回報「合約管理入口太多」，2026-10-21 下架 6 個頁籤——
    // 它們每一個在案件流程裡都已有對應步驟，留著只會讓人不確定該從哪邊簽約：
    //   新增合約 → 案件「合約」階段；合約變更單 → 案件「入住中」階段的變更單鈕；
    //   續約／退約／簽署狀態 → 案件清單與案件歷程；合約範本 → 後台合約版本管理。
    // 原頁面實作都保留，`/contract/?tab=xxx` 仍可直達。
    subItems: [
      { key: "list", label: "合約查詢與列表" },
      { key: "terms", label: "合約條款檢視" },
      { key: "childcare", label: "寶寶留房／托嬰合約" },
      { key: "new", label: "新增合約", hidden: true },
      { key: "templates", label: "合約範本管理", phase: 3, hidden: true },
      { key: "renewal", label: "續約管理", phase: 3, hidden: true },
      { key: "termination", label: "退約／作廢管理", phase: 3, hidden: true },
      { key: "sign-status", label: "合約簽署狀態總覽", phase: 3, hidden: true },
      { key: "change-order", label: "合約變更單", phase: 3, hidden: true },
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
    //
    // ⚠️ 2026-10-21 客戶要求先隱藏下列 10 項（hidden: true）：規格尚未定案，
    // 留在畫面上只是增加 DEMO 的噪音。資料與頁面實作都原封不動保留，
    // 要開回就把 hidden 拿掉。目前後台只剩「片語庫管理」與「資料回補與例外處理」。
    // 「系統參數設定」雖然隱藏，仍可用 /admin/?tab=system 直達（DEMO 要靠它切分期）。
    subItems: [
      { adminGroup: "system", key: "master", label: "基礎主檔設定", hidden: true },
      { adminGroup: "system", key: "staff", label: "人員與權限", hidden: true },
      { adminGroup: "system", key: "forms", label: "表單與欄位設定", hidden: true },
      { adminGroup: "system", key: "qrcode", label: "QR Code 管理", hidden: true },
      { adminGroup: "operations", key: "package", label: "套餐與贈品規則", hidden: true },
      { adminGroup: "operations", key: "contract-version", label: "合約版本管理", hidden: true },
      { adminGroup: "operations", key: "phrases", label: "片語庫管理" },
      { adminGroup: "operations", key: "backfill", label: "資料回補與例外處理" },
      { adminGroup: "operations", key: "kpi-rules", label: "評鑑指標設定", hidden: true },
      { adminGroup: "operations", key: "report", label: "報表查詢", hidden: true },
      { adminGroup: "operations", key: "board", label: "公佈欄設定", hidden: true },
      { adminGroup: "operations", key: "system", label: "系統參數設定", hidden: true },
    ],
  },
];
