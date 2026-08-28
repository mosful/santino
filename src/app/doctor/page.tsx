"use client";

import PageHeader from "@/components/ui/PageHeader";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import QueryList, { type Column } from "@/components/ui/QueryList";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";

type DoctorStat = {
  id: number;
  doctor: string;
  visitDays: number;
  scheduled: number;
  arrived: number;
  absent: number;
};

const SAMPLE: DoctorStat[] = [
  { id: 1, doctor: "陳O如", visitDays: 20, scheduled: 45, arrived: 42, absent: 3 },
  { id: 2, doctor: "王O明", visitDays: 12, scheduled: 30, arrived: 28, absent: 2 },
];

const columns: Column<DoctorStat>[] = [
  { key: "doctor", label: "醫師姓名" },
  { key: "visitDays", label: "巡診天數" },
  { key: "scheduled", label: "排診單數" },
  { key: "arrived", label: "已到單數" },
  { key: "absent", label: "未到單數" },
];

function DeptTab({ showTcmConsent }: { showTcmConsent?: boolean } = {}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input placeholder="醫師姓名篩選" className="rounded border border-stone-200 px-2 py-1.5" />
        <input placeholder="查詢區間起" className="rounded border border-stone-200 px-2 py-1.5" />
        <span>～</span>
        <input placeholder="查詢區間迄" className="rounded border border-stone-200 px-2 py-1.5" />
        <button className="rounded bg-stone-700 px-3 py-1.5 text-white">查詢</button>
      </div>
      <QueryList columns={columns} rows={SAMPLE} searchPlaceholder="醫師姓名" />
      {showTcmConsent && (
        <div className="rounded border border-stone-200 p-3">
          <div className="mb-2 text-xs font-medium text-stone-600">中醫看診同意書（6.3.1，新規劃）</div>
          <PlaceholderNotice text="中醫看診除預約掛號外，另需一份獨立的同意書文件；實際欄位內容尚未與客戶確認，先保留版位（見規格文件8.2節待確認事項）。" />
        </div>
      )}
    </div>
  );
}

export default function DoctorPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <PageHeader title="6. 醫師巡診" />
      <TabsFromUrl
        tabs={[
          { key: "obgyn", label: "婦產科", content: <DeptTab /> },
          { key: "pediatric", label: "兒科", content: <DeptTab /> },
          { key: "tcm", label: "中醫師", content: <DeptTab showTcmConsent /> },
        ]}
      />
    </div>
  );
}
