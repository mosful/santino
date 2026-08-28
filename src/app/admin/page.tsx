"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import EditableList, { type FieldSchema, type Row } from "@/components/ui/EditableList";
import ReportPicker from "@/components/reports/ReportPicker";
import { POSTPARTUM_REPORTS, ACCOUNTING_REPORTS } from "@/lib/reports";
import { ANNOUNCEMENTS } from "@/lib/mock/dashboard";
import SystemSettings from "./tabs/SystemSettings";
import PhraseLibrarySettings from "./tabs/PhraseLibrarySettings";

const simpleFields: FieldSchema[] = [
  { key: "name", label: "名稱" },
  { key: "note", label: "說明" },
];

function SimpleListTab({ rows, placeholder }: { rows: Row[]; placeholder: string }) {
  return <EditableList moduleNo="15" fields={simpleFields} initialRows={rows} searchPlaceholder={placeholder} />;
}

const VISIT_ROWS: Row[] = [
  { id: 1, name: "預約參觀報名資料", note: "已於畫面確認" },
  { id: 2, name: "取消預約明細表", note: "僅見選單，待確認" },
  { id: 3, name: "預約參觀時段設定", note: "僅見選單，待確認" },
];
const CONTRACT_DATA_ROWS: Row[] = [
  { id: 1, name: "客戶簽約資料", note: "已於畫面確認" },
  { id: 2, name: "客戶退訂資料", note: "僅見選單，待確認" },
  { id: 3, name: "合約轉住房資料", note: "僅見選單，待確認" },
];
const NURSING_DATA_ROWS: Row[] = [{ id: 1, name: "歷史病歷查詢", note: "已於畫面確認" }];
const SUPPLY_ROWS: Row[] = [{ id: 1, name: "備品名稱設定", note: "已於畫面確認" }];
const OTHER_SETTINGS_ROWS: Row[] = [
  "預約參觀訊息來源", "護理項目填寫設定", "打掃定期工作設定", "寶寶奶粉廠牌設定",
  "媽媽擠乳器廠牌設定", "護理後送醫院設定", "飲食禁忌項目設定", "產後客戶聯絡人分類",
  "醫師資料設定", "護理敘述性文字設定", "關懷片語文字設定", "產科敘述性文字設定", "兒科敘述性文字設定",
].map((name, i) => ({ id: i + 1, name, note: "" }));

const ROOM_DATA_ROWS: Row[] = [
  { id: 1, name: "房型設定", note: "" },
  { id: 2, name: "房間資料", note: "" },
  { id: 3, name: "房型價格設定", note: "" },
  { id: 4, name: "房價折扣設定", note: "" },
];

function RoomDataTab() {
  return <EditableList moduleNo="15" fields={simpleFields} initialRows={ROOM_DATA_ROWS} searchPlaceholder="項目名稱" />;
}

const announcementFields: FieldSchema[] = [
  { key: "title", label: "公告標題" },
  { key: "date", label: "發佈日期" },
  { key: "author", label: "發佈單位" },
];

function BoardSettingsTab() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-400">此處維護的公告會同步顯示於「1.中控中心＞公佈欄」。</p>
      <EditableList moduleNo="15" fields={announcementFields} initialRows={ANNOUNCEMENTS} searchPlaceholder="公告標題" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="15">
      <PageHeader title="15. 後台管理" />
      <TabsFromUrl
        tabs={[
          { key: "visit", label: "預約參觀管理", content: <SimpleListTab rows={VISIT_ROWS} placeholder="項目名稱" /> },
          { key: "contract-data", label: "客戶及簽約資料", content: <SimpleListTab rows={CONTRACT_DATA_ROWS} placeholder="項目名稱" /> },
          { key: "nursing-data", label: "護理紀錄資料", content: <SimpleListTab rows={NURSING_DATA_ROWS} placeholder="項目名稱" /> },
          { key: "postpartum-report", label: "產後報表查詢", content: <ReportPicker reports={POSTPARTUM_REPORTS} /> },
          { key: "accounting-report", label: "帳務報表查詢", content: <ReportPicker reports={ACCOUNTING_REPORTS} /> },
          { key: "supply", label: "備品庫存管理", content: <SimpleListTab rows={SUPPLY_ROWS} placeholder="備品名稱" /> },
          { key: "room-data", label: "房間資料管理", content: <RoomDataTab /> },
          { key: "board", label: "公佈欄設定", content: <BoardSettingsTab /> },
          { key: "other", label: "產後其他設定", content: <SimpleListTab rows={OTHER_SETTINGS_ROWS} placeholder="設定項目" /> },
          { key: "system", label: "系統參數設定", content: <SystemSettings /> },
          { key: "phrases", label: "常用語／片語庫設定", content: <PhraseLibrarySettings /> },
        ]}
      />
      </RequireAccess>
    </div>
  );
}
