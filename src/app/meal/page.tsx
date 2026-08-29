"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import EditableList, { type FieldSchema, type Row } from "@/components/ui/EditableList";
import { MAMA_ROOMS } from "@/lib/mock/mamaRoom";
import { makeRng, maskedName } from "@/lib/mock/genUtil";

const RESTRICTIONS = ["無", "無", "無", "無", "海鮮過敏", "麩質不耐", "乳製品過敏", "堅果過敏", "素食"];
const OCCUPIED_ROOMS = MAMA_ROOMS.filter((r) => r.motherName);
const rngMeal = makeRng(11001);
const MEALS: Row[] = Array.from({ length: 50 }, (_, i) => {
  const src = OCCUPIED_ROOMS[i % OCCUPIED_ROOMS.length];
  return {
    id: i + 1,
    room: src.room,
    name: i < OCCUPIED_ROOMS.length ? (src.motherName as string) : maskedName(rngMeal),
    deliveryMode: rngMeal.bool(0.55) ? "自然產" : "剖腹產",
    stayRange: src.stayRange ?? "08/01~09/01",
    restriction: rngMeal.pick(RESTRICTIONS),
  };
});

const mealFields: FieldSchema[] = [
  { key: "room", label: "房號" },
  { key: "name", label: "媽媽" },
  { key: "deliveryMode", label: "生產方式", type: "select", options: ["自然產", "剖腹產"] },
  { key: "stayRange", label: "入住期間" },
  { key: "restriction", label: "飲食禁忌" },
];

function OrderTab() {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-xs text-stone-500">
        <input type="checkbox" defaultChecked /> 僅顯示入住中
      </label>
      <p className="text-xs text-stone-400">
        房號/媽媽/生產方式/入住期間讀取自2.媽媽照護入住評估資料，飲食禁忌為本模組可維護欄位。
      </p>
      <EditableList moduleNo="9" fields={mealFields} initialRows={MEALS} searchPlaceholder="房號/媽媽姓名" />
      <div className="flex gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">列印飲食備註</button>
        <button className="rounded bg-stone-100 px-3 py-1.5">列印寶寶奶粉清單</button>
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
    <div className="overflow-x-auto rounded border border-stone-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-500">
          <tr>
            <th className="px-3 py-2">週次</th>
            <th className="px-3 py-2">週一</th>
            <th className="px-3 py-2">週二</th>
            <th className="px-3 py-2">週三</th>
          </tr>
        </thead>
        <tbody>
          {CYCLE_TEA.map((r) => (
            <tr key={r.week} className="border-t border-stone-100">
              <td className="px-3 py-2 font-medium">{r.week}</td>
              <td className="px-3 py-2">{r.mon}</td>
              <td className="px-3 py-2">{r.tue}</td>
              <td className="px-3 py-2">{r.wed}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="p-2 text-xs text-stone-400">支援「週次套用」機制，同一套茶飲可套用到不同起始週次。</p>
    </div>
  );
}

function SimpleStub({ text }: { text: string }) {
  return <div className="rounded border border-dashed border-stone-300 p-6 text-center text-sm text-stone-400">{text}</div>;
}

export default function MealPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="9">
      <PageHeader title="9. 月子餐" moduleNo="9" />
      <TabsFromUrl
        tabs={[
          { key: "order", label: "訂餐管理系統", content: <OrderTab /> },
          { key: "daily", label: "每日出餐明細", content: <SimpleStub text="依日期查詢房號/媽媽/編號/餐次出餐狀態" /> },
          { key: "restriction", label: "飲食禁忌統計", content: <SimpleStub text="讀取自2.媽媽照護入住評估病史分頁，不另維護一份禁忌清單" /> },
          { key: "menu-publish", label: "菜單發佈管理", content: <SimpleStub text="菜單製作與發佈" /> },
          { key: "menu-cycle", label: "循環菜單管理", content: <SimpleStub text="支援週次套用機制" /> },
          { key: "tea-cycle", label: "循環茶飲管理", content: <CycleTeaTab /> },
        ]}
      />
      </RequireAccess>
    </div>
  );
}
