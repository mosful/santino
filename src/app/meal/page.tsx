"use client";

import Tabs from "@/components/ui/Tabs";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Badge from "@/components/ui/Badge";

type MealRow = {
  id: number;
  room: string;
  name: string;
  deliveryMode: string;
  stayRange: string;
  restriction: string;
};

const MEALS: MealRow[] = [
  { id: 1, room: "301", name: "邱o乾", deliveryMode: "自然產", stayRange: "08/12~09/12", restriction: "無" },
  { id: 2, room: "302", name: "林o臻", deliveryMode: "剖腹產", stayRange: "08/20~09/17", restriction: "海鮮過敏" },
];

const columns: Column<MealRow>[] = [
  { key: "room", label: "房號" },
  { key: "name", label: "媽媽" },
  { key: "deliveryMode", label: "生產方式" },
  { key: "stayRange", label: "入住期間" },
  {
    key: "restriction",
    label: "飲食禁忌",
    render: (r) => (r.restriction === "無" ? <Badge color="slate">無</Badge> : <Badge color="amber">{r.restriction}</Badge>),
  },
];

function OrderTab() {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <input type="checkbox" defaultChecked /> 僅顯示入住中
      </label>
      <QueryList columns={columns} rows={MEALS} searchPlaceholder="房號/媽媽姓名" />
      <div className="flex gap-2 text-xs">
        <button className="rounded bg-slate-100 px-3 py-1.5">列印飲食備註</button>
        <button className="rounded bg-slate-100 px-3 py-1.5">列印寶寶奶粉清單</button>
      </div>
    </div>
  );
}

const CYCLE_TEA = [
  { week: "第1週", mon: "杜仲黑豆水", tue: "蓮子水", wed: "荔枝銀耳露" },
  { week: "第2週", mon: "紅棗茶", tue: "枸杞水", wed: "薏仁湯" },
];

function CycleTeaTab() {
  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">週次</th>
            <th className="px-3 py-2">週一</th>
            <th className="px-3 py-2">週二</th>
            <th className="px-3 py-2">週三</th>
          </tr>
        </thead>
        <tbody>
          {CYCLE_TEA.map((r) => (
            <tr key={r.week} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium">{r.week}</td>
              <td className="px-3 py-2">{r.mon}</td>
              <td className="px-3 py-2">{r.tue}</td>
              <td className="px-3 py-2">{r.wed}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="p-2 text-xs text-slate-400">支援「週次套用」機制，同一套茶飲可套用到不同起始週次。</p>
    </div>
  );
}

function SimpleStub({ text }: { text: string }) {
  return <div className="rounded border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">{text}</div>;
}

export default function MealPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <h1 className="mb-4 text-lg font-bold">9. 月子餐</h1>
      <Tabs
        tabs={[
          { key: "order", label: "訂餐管理系統", content: <OrderTab /> },
          { key: "daily", label: "每日出餐明細", content: <SimpleStub text="依日期查詢房號/媽媽/編號/餐次出餐狀態" /> },
          { key: "restriction", label: "飲食禁忌統計", content: <SimpleStub text="讀取自2.媽媽照護入住評估病史分頁，不另維護一份禁忌清單" /> },
          { key: "menu-publish", label: "菜單發佈管理", content: <SimpleStub text="菜單製作與發佈" /> },
          { key: "menu-cycle", label: "循環菜單管理", content: <SimpleStub text="支援週次套用機制" /> },
          { key: "tea-cycle", label: "循環茶飲管理", content: <CycleTeaTab /> },
        ]}
      />
    </div>
  );
}
