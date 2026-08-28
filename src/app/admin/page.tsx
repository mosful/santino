"use client";

import Tabs from "@/components/ui/Tabs";
import QueryList, { type Column } from "@/components/ui/QueryList";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import ReportPicker from "@/components/reports/ReportPicker";
import { POSTPARTUM_REPORTS, ACCOUNTING_REPORTS } from "@/lib/reports";
import SystemSettings from "./tabs/SystemSettings";

type SimpleRow = { id: number; name: string; note: string };

function SimpleListTab({ rows, placeholder }: { rows: SimpleRow[]; placeholder: string }) {
  const columns: Column<SimpleRow>[] = [
    { key: "name", label: "名稱" },
    { key: "note", label: "說明" },
  ];
  return <QueryList columns={columns} rows={rows} searchPlaceholder={placeholder} />;
}

const VISIT_ROWS: SimpleRow[] = [
  { id: 1, name: "預約參觀報名資料", note: "已於畫面確認" },
  { id: 2, name: "取消預約明細表", note: "僅見選單，待確認" },
  { id: 3, name: "預約參觀時段設定", note: "僅見選單，待確認" },
];
const CONTRACT_DATA_ROWS: SimpleRow[] = [
  { id: 1, name: "客戶簽約資料", note: "已於畫面確認" },
  { id: 2, name: "客戶退訂資料", note: "僅見選單，待確認" },
  { id: 3, name: "合約轉住房資料", note: "僅見選單，待確認" },
];
const NURSING_DATA_ROWS: SimpleRow[] = [{ id: 1, name: "歷史病歷查詢", note: "已於畫面確認" }];
const SUPPLY_ROWS: SimpleRow[] = [{ id: 1, name: "備品名稱設定", note: "已於畫面確認" }];
const OTHER_SETTINGS_ROWS: SimpleRow[] = [
  "預約參觀訊息來源", "護理項目填寫設定", "打掃定期工作設定", "寶寶奶粉廠牌設定",
  "媽媽擠乳器廠牌設定", "護理後送醫院設定", "飲食禁忌項目設定", "產後客戶聯絡人分類",
  "醫師資料設定", "護理敘述性文字設定", "關懷片語文字設定", "產科敘述性文字設定", "兒科敘述性文字設定",
].map((name, i) => ({ id: i + 1, name, note: "" }));

function RoomDataTab() {
  return (
    <div className="space-y-2 text-xs">
      {["房型設定", "房間資料", "房型價格設定", "房價折扣設定"].map((n) => (
        <div key={n} className="rounded border border-slate-200 p-2">
          {n}
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-4 text-lg font-bold">15. 後台管理</h1>
      <Tabs
        tabs={[
          { key: "visit", label: "預約參觀管理", content: <SimpleListTab rows={VISIT_ROWS} placeholder="項目名稱" /> },
          { key: "contract-data", label: "客戶及簽約資料", content: <SimpleListTab rows={CONTRACT_DATA_ROWS} placeholder="項目名稱" /> },
          { key: "nursing-data", label: "護理紀錄資料", content: <SimpleListTab rows={NURSING_DATA_ROWS} placeholder="項目名稱" /> },
          { key: "postpartum-report", label: "產後報表查詢", content: <ReportPicker reports={POSTPARTUM_REPORTS} /> },
          { key: "accounting-report", label: "帳務報表查詢", content: <ReportPicker reports={ACCOUNTING_REPORTS} /> },
          { key: "supply", label: "備品庫存管理", content: <SimpleListTab rows={SUPPLY_ROWS} placeholder="備品名稱" /> },
          { key: "room-data", label: "房間資料管理", content: <RoomDataTab /> },
          {
            key: "board",
            label: "公佈欄設定",
            content: <PlaceholderNotice text="對應1.中控中心公佈欄之後台編輯設定（新增/修改/刪除公告）。" />,
          },
          { key: "other", label: "產後其他設定", content: <SimpleListTab rows={OTHER_SETTINGS_ROWS} placeholder="設定項目" /> },
          { key: "system", label: "系統參數設定", content: <SystemSettings /> },
        ]}
      />
    </div>
  );
}
