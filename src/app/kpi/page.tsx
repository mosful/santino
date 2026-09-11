"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import EditableList, { type FieldSchema, type Row } from "@/components/ui/EditableList";
import { makeRng, addDays } from "@/lib/mock/genUtil";
import { RED_RASH_GRADES, useKpiSettings, type RedRashGrade } from "@/lib/kpiRuleStore";

const CARE_INDICATORS = [
  "純母乳哺育率",
  "混合哺育率",
  "純配方奶哺育率",
  "混合親餵瓶餵母乳哺育率",
  "3天8小時親子同室率A",
  "3天8小時親子同室率B",
  "3天8小時親子同室率C",
];

const INFECTION_INDICATORS = ["導管使用密度率", "發燒發生率", "上呼吸道感染率", "乳腺炎發生率", "泌尿道感染發生率"];

function trendValues(label: string) {
  const seed = Array.from(label).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return [0, 1, 2, 3, 4, 5].map((offset) => 45 + ((seed + offset * 17) % 48));
}

function IndicatorTab({ indicators }: { indicators: string[] }) {
  const [active, setActive] = useState(indicators[0]);
  const settings = useKpiSettings();
  const values = useMemo(() => trendValues(active), [active]);
  const rule = settings.rules.find((item) => item.label === active);
  const target = rule?.target ?? 80;

  return (
    <div className="grid gap-4 lg:grid-cols-[210px_1fr]">
      <ul className="flex gap-2 overflow-x-auto pb-1 text-sm lg:block lg:space-y-1 lg:overflow-visible">
        {indicators.map((indicator) => (
          <li key={indicator} className="shrink-0">
            <button type="button" onClick={() => setActive(indicator)} className={"w-full rounded-lg px-3 py-2 text-left " + (indicator === active ? "bg-rose-500 text-white" : "bg-white hover:bg-stone-100")}>
              {indicator}
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="text-xs text-stone-400">本月結果</div>
            <div className="mt-1 text-2xl font-bold text-stone-700">{values.at(-1)}%</div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="text-xs text-stone-400">目標值</div>
            <div className="mt-1 text-2xl font-bold text-sky-600">{target}%</div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="text-xs text-stone-400">判定</div>
            <div className={"mt-2 font-bold " + ((values.at(-1) ?? 0) >= target ? "text-emerald-600" : "text-amber-600")}>
              {(values.at(-1) ?? 0) >= target ? "已達標" : "需追蹤"}
            </div>
          </div>
        </div>

        {rule && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-700">
            後台統計規則：{rule.numerator} ÷ {rule.denominator} × 100%
          </div>
        )}

        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-stone-700">{active}｜近六個月趨勢</h3>
            <span className="text-xs text-stone-400">2026-04～2026-09</span>
          </div>
          <div className="flex h-48 items-end gap-3 border-b border-l border-stone-200 px-3 pt-4">
            {values.map((value, index) => (
              <div key={index} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[11px] font-medium text-stone-600">{value}%</span>
                <div className={"w-full max-w-14 rounded-t-md " + (value >= target ? "bg-emerald-400" : "bg-amber-400")} style={{ height: `${Math.max(12, value * 1.35)}px` }} />
                <span className="text-[10px] text-stone-400">{index + 4}月</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const RASH_CASES: { id: number; date: string; chartNo: string; baby: string; grade: RedRashGrade; recorder: string }[] = [
  { id: 1, date: "2026-09-02", chartNo: "B20260902301", baby: "邱小弟", grade: "0級", recorder: "婉真" },
  { id: 2, date: "2026-09-03", chartNo: "B20260903305", baby: "張小妹", grade: "A級", recorder: "婉真" },
  { id: 3, date: "2026-09-04", chartNo: "B20260904307", baby: "陳小弟", grade: "A級", recorder: "護理師雅婷" },
  { id: 4, date: "2026-09-05", chartNo: "B20260905309", baby: "林小妹", grade: "B級", recorder: "護理師雅婷" },
  { id: 5, date: "2026-09-06", chartNo: "B20260906311", baby: "王小弟", grade: "C級", recorder: "婉真" },
  { id: 6, date: "2026-09-07", chartNo: "B20260907315", baby: "李小妹", grade: "二級", recorder: "護理師小玲" },
  { id: 7, date: "2026-09-08", chartNo: "B20260908318", baby: "黃小弟", grade: "0級", recorder: "護理師小玲" },
  { id: 8, date: "2026-09-09", chartNo: "B20260909322", baby: "吳小妹", grade: "B級", recorder: "婉真" },
];

function RedRashStatistics() {
  const settings = useKpiSettings();
  const [gradeFilter, setGradeFilter] = useState<RedRashGrade | "全部">("全部");
  const filtered = gradeFilter === "全部" ? RASH_CASES : RASH_CASES.filter((item) => item.grade === gradeFilter);
  const includedCount = RASH_CASES.filter((item) => settings.includedRashGrades.includes(item.grade)).length;
  const rashRule = settings.rules.find((rule) => rule.id === "rash");

  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <h3 className="font-medium text-stone-700">紅臀分級統計</h3>
          <p className="text-xs text-stone-400">0～C級與「二級」分開顯示；是否納入發生率由後台規則控制。</p>
        </div>
        <select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value as RedRashGrade | "全部")} className="ml-auto rounded-lg border border-stone-200 px-3 py-2 text-sm">
          <option>全部</option>
          {RED_RASH_GRADES.map((grade) => <option key={grade}>{grade}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {RED_RASH_GRADES.map((grade) => {
          const count = RASH_CASES.filter((item) => item.grade === grade).length;
          const included = settings.includedRashGrades.includes(grade);
          return (
            <button type="button" key={grade} onClick={() => setGradeFilter(grade)} className={"rounded-xl border p-3 text-left " + (gradeFilter === grade ? "border-rose-400 bg-rose-50" : "border-stone-200 bg-stone-50")}>
              <div className="flex items-center justify-between text-xs text-stone-500"><span>{grade}</span><span>{included ? "納入" : "排除"}</span></div>
              <div className="mt-1 text-xl font-bold text-stone-700">{count}<span className="ml-1 text-xs font-normal">人</span></div>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
        本月納入統計 {includedCount} 人；警示目標 {rashRule?.target ?? 5}%（原型分母假設為本月照護寶寶總人數 120 人）。
      </div>

      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-stone-50 text-xs text-stone-500"><tr><th className="px-3 py-2">日期</th><th className="px-3 py-2">病歷號</th><th className="px-3 py-2">寶寶</th><th className="px-3 py-2">分級</th><th className="px-3 py-2">是否納入</th><th className="px-3 py-2">記錄者</th></tr></thead>
          <tbody>{filtered.map((item) => <tr key={item.id} className="border-t border-stone-100"><td className="px-3 py-2">{item.date}</td><td className="px-3 py-2 text-stone-500">{item.chartNo}</td><td className="px-3 py-2">{item.baby}</td><td className="px-3 py-2 font-medium text-rose-600">{item.grade}</td><td className="px-3 py-2">{settings.includedRashGrades.includes(item.grade) ? "是" : "否"}</td><td className="px-3 py-2">{item.recorder}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

const INCIDENT_TYPES = ["紅臀", "跌倒", "燙傷", "嗆奶", "皮膚紅疹", "藥物過敏", "感染", "壓瘡"];
const rngIncident = makeRng(10001);
const INCIDENTS: Row[] = [
  { id: 1, date: "2026-08-20", type: "紅臀", target: "寶寶", rashGrade: "B級", status: "已結案" },
  { id: 2, date: "2026-08-25", type: "跌倒", target: "媽媽", rashGrade: "不適用", status: "處理中" },
  ...Array.from({ length: 48 }, (_, index) => ({
    id: index + 3,
    date: addDays("2026-06-01", rngIncident.int(0, 89)),
    type: rngIncident.pick(INCIDENT_TYPES),
    target: rngIncident.pick(["媽媽", "寶寶"]),
    rashGrade: rngIncident.pick(["不適用", ...RED_RASH_GRADES]),
    status: rngIncident.bool(0.75) ? "已結案" : "處理中",
  })),
];

const incidentFields: FieldSchema[] = [
  { key: "date", label: "通報日期" },
  { key: "type", label: "類別", type: "select", options: INCIDENT_TYPES },
  { key: "target", label: "對象屬別", type: "select", options: ["媽媽", "寶寶"] },
  { key: "rashGrade", label: "紅臀分級", type: "select", options: ["不適用", ...RED_RASH_GRADES] },
  { key: "status", label: "通報狀態", type: "select", options: ["處理中", "已結案"] },
];

function SafetyTab() {
  return (
    <div className="space-y-5">
      <RedRashStatistics />
      <section>
        <h3 className="mb-2 font-medium text-stone-700">病安事件明細</h3>
        <EditableList moduleNo="8" fields={incidentFields} initialRows={INCIDENTS} searchPlaceholder="通報日期／類別／對象／紅臀分級" />
      </section>
    </div>
  );
}

export default function KpiPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="8">
        <PageHeader title="8. 評鑑指標" moduleNo="8" />
        <TabsFromUrl tabs={[
          { key: "care", label: "照護指標", content: <IndicatorTab indicators={CARE_INDICATORS} /> },
          { key: "infection", label: "感染指標", content: <IndicatorTab indicators={INFECTION_INDICATORS} /> },
          { key: "professional", label: "專業指標", content: <IndicatorTab indicators={["紅疹發生率", "護理指導達成率"]} /> },
          { key: "safety", label: "病安指標", content: <SafetyTab /> },
        ]} />
      </RequireAccess>
    </div>
  );
}
