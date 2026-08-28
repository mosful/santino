"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Badge from "@/components/ui/Badge";

type Reminder = {
  id: number;
  name: string;
  contactDate: string;
  phone: string;
  staff: string;
  status: string;
};

const SAMPLE: Reminder[] = [
  { id: 1, name: "陳o如", contactDate: "2026-09-05", phone: "0912-xxx-xxx", staff: "小美", status: "待聯絡" },
  { id: 2, name: "黃o婷", contactDate: "2026-08-30", phone: "0922-xxx-xxx", staff: "阿凱", status: "已聯絡" },
];

const columns: Column<Reminder>[] = [
  { key: "name", label: "孕媽姓名" },
  { key: "contactDate", label: "預計聯絡日" },
  { key: "phone", label: "聯絡電話" },
  { key: "staff", label: "客服人員" },
  {
    key: "status",
    label: "聯絡狀態",
    render: (r) => <Badge color={r.status === "已聯絡" ? "green" : "amber"}>{r.status}</Badge>,
  },
];

// 各分頁共用「聯絡提醒」核心元件：查詢日期區間＋分類＋孕媽姓名＋聯絡電話＋客服人員＋聯絡狀態
function ContactReminderTab({ note }: { note?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input placeholder="查詢日期起" className="rounded border border-stone-200 px-2 py-1.5" />
        <span>～</span>
        <input placeholder="查詢日期迄" className="rounded border border-stone-200 px-2 py-1.5" />
        <select className="rounded border border-stone-200 px-2 py-1.5">
          <option>分類：全部</option>
        </select>
        <button className="rounded bg-stone-700 px-3 py-1.5 text-white">查詢</button>
      </div>
      <QueryList columns={columns} rows={SAMPLE} searchPlaceholder="孕媽姓名" />
      {note && <p className="text-xs text-stone-400">{note}</p>}
    </div>
  );
}

export default function CarePage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="7">
      <PageHeader title="7. 媽媽關懷" />
      <TabsFromUrl
        tabs={[
          { key: "visit", label: "參觀提醒", content: <ContactReminderTab /> },
          { key: "prenatal", label: "產前關懷", content: <ContactReminderTab /> },
          { key: "pre-admission", label: "入住前關懷", content: <ContactReminderTab /> },
          {
            key: "home-return",
            label: "返家關懷",
            content: <ContactReminderTab note="首頁角標「返家關懷*30」需與本頁待追蹤筆數即時同步。" />,
          },
          { key: "contract-reminder", label: "簽約提醒", content: <ContactReminderTab /> },
          { key: "pregnancy", label: "孕期關懷", content: <ContactReminderTab /> },
        ]}
      />
      </RequireAccess>
    </div>
  );
}
