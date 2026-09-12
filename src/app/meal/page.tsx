"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import EditableList, { type FieldSchema, type Row } from "@/components/ui/EditableList";
import { MAMA_ROOMS } from "@/lib/mock/mamaRoom";
import { makeRng } from "@/lib/mock/genUtil";
import DemoActionButton from "@/components/ui/DemoActionButton";

const RESTRICTIONS = ["無", "無", "無", "無", "海鮮過敏", "麩質不耐", "乳製品過敏", "堅果過敏", "素食"];
const rngMeal = makeRng(11001);
// 房號、媽媽姓名、入住期間皆讀取自 MAMA_ROOMS，空房不虛構訂餐資料，
// 確保與2.媽媽照護、4.房間動態看到的入住狀態一致。
const MEALS: Row[] = MAMA_ROOMS.map((src, i) => {
  const occupied = !!src.motherName;
  return {
    id: i + 1,
    room: src.room,
    name: occupied ? src.motherName! : "（空房）",
    deliveryMode: occupied ? (rngMeal.bool(0.55) ? "自然產" : "剖腹產") : "－",
    stayRange: occupied ? (src.stayRange ?? "08/01~09/01") : "－",
    restriction: occupied ? rngMeal.pick(RESTRICTIONS) : "－",
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
  const [occupiedOnly, setOccupiedOnly] = useState(true);
  const rows = occupiedOnly ? MEALS.filter((r) => r.name !== "（空房）") : MEALS;
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-xs text-stone-500">
        <input
          type="checkbox"
          checked={occupiedOnly}
          onChange={(e) => setOccupiedOnly(e.target.checked)}
        />{" "}
        僅顯示入住中
      </label>
      <p className="text-xs text-stone-400">
        房號/媽媽/生產方式/入住期間讀取自2.媽媽照護入住評估資料，飲食禁忌為本模組可維護欄位。
      </p>
      <EditableList
        key={occupiedOnly ? "occupied" : "all"}
        moduleNo="9"
        fields={mealFields}
        initialRows={rows}
        searchPlaceholder="房號/媽媽姓名"
      />
      <div className="flex gap-2 text-xs">
        <DemoActionButton feedback="飲食備註列印預覽已開啟（Demo 模式）" onClick={() => window.print()} className="rounded bg-stone-100 px-3 py-1.5">列印飲食備註</DemoActionButton>
        <DemoActionButton feedback="寶寶奶粉清單列印預覽已開啟（Demo 模式）" onClick={() => window.print()} className="rounded bg-stone-100 px-3 py-1.5">列印寶寶奶粉清單</DemoActionButton>
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

function DailyMealTab() {
  const rows = MEALS.filter((row) => row.name !== "（空房）").slice(0, 6);
  return (
    <div className="overflow-x-auto rounded border border-stone-200">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-500"><tr><th className="px-3 py-2">房號</th><th className="px-3 py-2">媽媽</th><th className="px-3 py-2">早餐</th><th className="px-3 py-2">午餐</th><th className="px-3 py-2">晚餐</th><th className="px-3 py-2">備註</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-stone-100"><td className="px-3 py-2">{String(row.room)}</td><td className="px-3 py-2">{String(row.name)}</td><td className="px-3 py-2 text-emerald-600">已出餐</td><td className="px-3 py-2 text-amber-600">備餐中</td><td className="px-3 py-2 text-stone-400">待備餐</td><td className="px-3 py-2">{String(row.restriction)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function RestrictionStatsTab() {
  const counts = MEALS.filter((row) => row.name !== "（空房）").reduce<Record<string, number>>((result, row) => {
    const key = String(row.restriction);
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(counts).map(([label, count]) => <div key={label} className="rounded-xl border border-stone-200 bg-white p-4"><div className="text-xs text-stone-400">飲食備註</div><div className="mt-1 flex items-end justify-between"><strong className="text-stone-700">{label}</strong><span className="text-xl font-bold text-rose-500">{count}</span></div></div>)}
    </div>
  );
}

function MenuPublishTab() {
  return (
    <div className="space-y-3 text-sm">
      {["09/14～09/20 秋季調養菜單", "09/21～09/27 產後修復菜單"].map((name, index) => <div key={name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 p-3"><div><div className="font-medium text-stone-700">{name}</div><div className="text-xs text-stone-400">{index === 0 ? "已發佈至住客 WebApp" : "草稿・待營養師確認"}</div></div><DemoActionButton feedback={index === 0 ? "已開啟菜單預覽" : "菜單草稿已送交確認"} className="rounded bg-stone-100 px-3 py-1.5 text-xs">{index === 0 ? "預覽" : "送交確認"}</DemoActionButton></div>)}
    </div>
  );
}

function MenuCycleTab() {
  return (
    <div className="overflow-x-auto rounded border border-stone-200">
      <table className="w-full min-w-max text-left text-sm"><thead className="bg-stone-50 text-xs text-stone-500"><tr><th className="px-3 py-2">週次</th><th className="px-3 py-2">早餐主食</th><th className="px-3 py-2">午餐主菜</th><th className="px-3 py-2">晚餐主菜</th></tr></thead><tbody><tr className="border-t border-stone-100"><td className="px-3 py-2">第1週</td><td className="px-3 py-2">麻油雞粥</td><td className="px-3 py-2">杜仲腰花</td><td className="px-3 py-2">清蒸鱸魚</td></tr><tr className="border-t border-stone-100"><td className="px-3 py-2">第2週</td><td className="px-3 py-2">山藥排骨粥</td><td className="px-3 py-2">紅棗燉雞</td><td className="px-3 py-2">枸杞鮮魚</td></tr></tbody></table>
      <p className="p-2 text-xs text-stone-400">循環菜單依入住週次自動套用，飲食禁忌會另外標示。</p>
    </div>
  );
}

export default function MealPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="9">
      <PageHeader title="9. 月子餐" moduleNo="9" />
      <TabsFromUrl
        tabs={[
          { key: "order", label: "訂餐管理系統", content: <OrderTab /> },
          { key: "daily", label: "每日出餐明細", content: <DailyMealTab /> },
          { key: "restriction", label: "飲食禁忌統計", content: <RestrictionStatsTab /> },
          { key: "menu-publish", label: "菜單發佈管理", content: <MenuPublishTab /> },
          { key: "menu-cycle", label: "循環菜單管理", content: <MenuCycleTab /> },
          { key: "tea-cycle", label: "循環茶飲管理", content: <CycleTeaTab /> },
        ]}
      />
      </RequireAccess>
    </div>
  );
}
