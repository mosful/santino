"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Badge from "@/components/ui/Badge";

const CARE_INDICATORS = [
  "純母乳哺育率",
  "混合哺育率",
  "純配方奶哺育率",
  "混合親餵瓶餵母乳哺育率",
  "3天8小時親子同室率A",
  "3天8小時親子同室率B",
  "3天8小時親子同室率C",
];

function IndicatorTab({ indicators, buildingNote }: { indicators: string[]; buildingNote?: string }) {
  const [active, setActive] = useState(indicators[0]);
  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <ul className="space-y-1 text-sm">
        {indicators.map((i) => (
          <li key={i}>
            <button
              onClick={() => setActive(i)}
              className={
                "w-full rounded px-2 py-1.5 text-left " +
                (i === active ? "bg-rose-500 text-white" : "hover:bg-slate-100")
              }
            >
              {i}
            </button>
          </li>
        ))}
      </ul>
      <div>
        {buildingNote ? (
          <div className="flex h-40 items-center justify-center rounded border border-dashed border-slate-300 text-slate-400">
            {buildingNote}
          </div>
        ) : (
          <>
            <div className="mb-2 flex h-40 items-center justify-center rounded border border-slate-200 text-xs text-slate-400">
              {active}｜逐月數據趨勢折線圖（示意）
            </div>
            <p className="text-xs text-slate-400">公式獨立設定為可調參數，避免寫死在程式中。</p>
          </>
        )}
      </div>
    </div>
  );
}

type Incident = { id: number; date: string; type: string; target: string; status: string };
const INCIDENTS: Incident[] = [
  { id: 1, date: "2026-08-20", type: "紅臀", target: "寶寶", status: "已結案" },
  { id: 2, date: "2026-08-25", type: "跌倒", target: "媽媽", status: "處理中" },
];
const columns: Column<Incident>[] = [
  { key: "date", label: "通報日期" },
  { key: "type", label: "類別" },
  { key: "target", label: "對象屬別" },
  { key: "status", label: "通報狀態", render: (r) => <Badge color={r.status === "已結案" ? "green" : "amber"}>{r.status}</Badge> },
];

function SafetyTab() {
  return (
    <div className="space-y-3">
      <QueryList columns={columns} rows={INCIDENTS} searchPlaceholder="通報日期/類別/對象" />
      <p className="rounded border border-sky-200 bg-sky-50 p-2 text-xs text-sky-700">
        紅臀統計需依分級（0~C級＋額外「二級」分類）分別統計人數，不只是單純發生/未發生人數（新系統需求，見功能清單v16）。
      </p>
    </div>
  );
}

export default function KpiPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <h1 className="mb-4 text-lg font-bold">8. 評鑑指標</h1>
      <Tabs
        tabs={[
          { key: "care", label: "照護指標", content: <IndicatorTab indicators={CARE_INDICATORS} /> },
          {
            key: "infection",
            label: "感染指標",
            content: (
              <IndicatorTab
                indicators={["導管使用密度率", "發燒發生率", "上呼吸道感染率", "乳腺炎發生率", "泌尿道感染發生率"]}
              />
            ),
          },
          {
            key: "professional",
            label: "專業指標",
            content: (
              <IndicatorTab
                indicators={["紅疹發生率", "護理指導達成率"]}
                buildingNote="系統原生顯示「建置中」（既有系統本身尚未完工，非文件疏漏）"
              />
            ),
          },
          { key: "safety", label: "病安指標", content: <SafetyTab /> },
        ]}
      />
    </div>
  );
}
