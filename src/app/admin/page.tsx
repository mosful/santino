"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import Tabs from "@/components/ui/Tabs";
import EditableList, { type FieldSchema, type Row } from "@/components/ui/EditableList";
import ReportPicker from "@/components/reports/ReportPicker";
import { POSTPARTUM_REPORTS, ACCOUNTING_REPORTS } from "@/lib/reports";
import { ANNOUNCEMENTS } from "@/lib/mock/dashboard";
import { OPS_ROOMS } from "@/lib/mock/opsRoom";
import { makeRng } from "@/lib/mock/genUtil";
import SystemSettings from "./tabs/SystemSettings";
import BackfillSettings from "./tabs/BackfillSettings";
import StaffPermissionSettings from "./tabs/StaffPermissionSettings";
import QrCardPanel from "@/components/babycam/QrCardPanel";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import Link from "next/link";
import PhraseLibrarySettings from "./tabs/PhraseLibrarySettings";
import AssessmentFormSettings from "./tabs/AssessmentFormSettings";
import KpiRuleSettings from "./tabs/KpiRuleSettings";
import { canEditAdminSetting } from "@/lib/permissions";
import { MODULES, type SubItem } from "@/lib/modules";
import { useCurrentRole } from "@/lib/roleStore";
import { buttonStyles } from "@/components/ui/buttonStyles";

const simpleFields: FieldSchema[] = [
  { key: "name", label: "名稱" },
  { key: "note", label: "說明" },
];

const OTHER_SETTINGS_BASE = [
  "預約參觀訊息來源", "打掃定期工作設定", "寶寶奶粉廠牌設定",
  "媽媽擠乳器廠牌設定", "護理後送醫院設定", "飲食禁忌項目設定", "產後客戶聯絡人分類",
  "醫師資料設定", "護理敘述性文字設定", "關懷片語文字設定", "產科敘述性文字設定", "兒科敘述性文字設定",
];
const OTHER_SETTINGS_ROWS: Row[] = OTHER_SETTINGS_BASE.map((name, i) => ({ id: i + 1, name, note: "" }));

const ROOM_SETTING_KINDS = ["房型價格設定", "房價折扣設定", "淡旺季加價設定", "續住優惠設定"];
const rngRoomSetting = makeRng(16001);
// 逐房設定：每個房號各自一列，房號本身即為天生不重複的鍵值，比通用分類標籤更真實
const ROOM_DATA_ROWS: Row[] = [
  { id: 1, name: "房型設定", note: "" },
  { id: 2, name: "房間資料", note: "" },
  { id: 3, name: "房型價格設定", note: "" },
  { id: 4, name: "房價折扣設定", note: "" },
  ...OPS_ROOMS.slice(0, 46).map((r, i) => ({
    id: i + 5,
    name: `${r.room}房（${r.roomType}）－${rngRoomSetting.pick(ROOM_SETTING_KINDS)}`,
    note: "",
  })),
];

const announcementFields: FieldSchema[] = [
  { key: "title", label: "公告標題" },
  { key: "date", label: "發佈日期" },
  { key: "author", label: "發佈單位" },
];

function BoardSettingsTab({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-400">此處維護的公告會同步顯示於首頁的「最新公告」區塊。</p>
      <EditableList moduleNo="15" editAllowed={canEdit} fields={announcementFields} initialRows={ANNOUNCEMENTS} searchPlaceholder="公告標題" />
    </div>
  );
}

/** 基礎主檔設定：房間與院內各式主檔，v24 §10 標示為僅管理者可修改。 */
function MasterDataTab({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          此為系統面設定，僅「管理者」可修改，目前為唯讀檢視。
        </p>
      )}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-700">房型與房間資料</h3>
        <EditableList moduleNo="15" editAllowed={canEdit} fields={simpleFields} initialRows={ROOM_DATA_ROWS} searchPlaceholder="項目名稱" />
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-700">產後其他主檔</h3>
        <EditableList moduleNo="15" editAllowed={canEdit} fields={simpleFields} initialRows={OTHER_SETTINGS_ROWS} searchPlaceholder="設定項目" />
      </section>
    </div>
  );
}

/** 報表查詢：產後與帳務兩組報表合併為 v24 的單一「報表查詢」入口。 */
function ReportTab() {
  return (
    <Tabs
      tabs={[
        { key: "postpartum", label: "產後報表", content: <ReportPicker reports={POSTPARTUM_REPORTS} /> },
        { key: "accounting", label: "帳務報表", content: <ReportPicker reports={ACCOUNTING_REPORTS} /> },
      ]}
    />
  );
}

/** v24 §10 列為「入口，待製作」的項目：誠實說明範圍，並指向目前能看到的地方。 */
function PendingEntry({ title, detail, href, hrefLabel }: { title: string; detail: string; href: string; hrefLabel: string }) {
  return (
    <div className="max-w-3xl space-y-3">
      <PlaceholderNotice text={`${title}：依 v24 規格為後台入口，本階段尚未製作維護畫面。`} />
      <p className="text-sm leading-6 text-stone-600">{detail}</p>
      <Link href={href} className={buttonStyles()}>
        {hrefLabel}
      </Link>
    </div>
  );
}

/**
 * key → 頁籤內容。
 *
 * ⚠️ 頁籤的「有哪些、叫什麼、排什麼順序、誰看得到」一律以 `lib/modules.ts`
 * 的模組 15 subItems 為準，這裡只回答「這個 key 要渲染什麼」。
 * 以前兩邊各寫一份，選單改了頁面沒改（或反過來）就會對不上。
 */
function adminTabContent(key: string, canEditSystem: boolean, canEditOperations: boolean) {
  switch (key) {
    case "master":
      return <MasterDataTab canEdit={canEditSystem} />;
    case "staff":
      return <StaffPermissionSettings />;
    case "forms":
      return <AssessmentFormSettings />;
    case "qrcode":
      return <QrCardPanel />;
    case "package":
      return (
        <PendingEntry
          title="套餐與贈品規則"
          detail="房型 × 天數 × 生產院所 × 價格身分的定價表、贈天數與贈課程門檻，目前寫在程式內的示範值。待取得客戶實際定價 Excel 後改為此處維護。"
          href="/cases/"
          hrefLabel="先到案件流程看套餐快速試算"
        />
      );
    case "contract-version":
      return (
        <PendingEntry
          title="合約版本管理"
          detail="合約條文版本（啟用中／停用）與合約範本的維護入口。改條文一律開新版，不影響已簽署合約。目前可於合約模組內檢視。"
          href="/contract/?tab=terms"
          hrefLabel="前往合約條款檢視"
        />
      );
    case "phrases":
      return <PhraseLibrarySettings />;
    case "backfill":
      return <BackfillSettings />;
    case "kpi-rules":
      return <KpiRuleSettings />;
    case "report":
      return <ReportTab />;
    case "board":
      return <BoardSettingsTab canEdit={canEditOperations} />;
    case "system":
      return <SystemSettings />;
    default:
      return null;
  }
}

export default function AdminPage() {
  const role = useCurrentRole();
  const canEditOperations = canEditAdminSetting(role, "operations");
  const canEditSystem = canEditAdminSetting(role, "system");

  // 權限過濾：不屬於該角色的項目直接不存在（不是顯示後改唯讀）。
  const allowed = (MODULES.find((m) => m.no === "15")?.subItems ?? []).filter(
    (item) => !item.adminGroup || canEditAdminSetting(role, item.adminGroup),
  );
  const toTab = (item: SubItem) => ({
    key: item.key,
    label: item.label,
    content: adminTabContent(item.key, canEditSystem, canEditOperations),
  });

  return (
    <div className="page-frame">
      <RequireAccess moduleNo="15">
        <PageHeader title="後台管理" moduleNo="15" />
        <TabsFromUrl
          tabs={allowed.filter((item) => !item.hidden).map(toTab)}
          // 客戶要求下架的項目（modules.ts 的 hidden）不列在頁籤列，
          // 但保留 /admin/?tab=xxx 直達——DEMO 要靠「系統參數設定」切換功能分期。
          deepLinkTabs={allowed.filter((item) => item.hidden).map(toTab)}
        />
      </RequireAccess>
    </div>
  );
}
