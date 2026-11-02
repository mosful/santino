"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { useDomainStore } from "@/lib/demo/domainStore";
import { buildMonthlyStats, DAY_BUCKETS } from "@/lib/domain/monthlyStats";

/**
 * 月統計表（客戶手冊第 47 頁的紙本表格）。
 *
 * 欄位照抄：月份 × 接單數、精緻房、VIP、VILLA、0-14 天、15-21 天、21+1 天、28+2 天、30 天、其他天數。
 * ⚠️ 天數級距不是連續區間：21 天與 28 天是「贈 1 天／贈 2 天」的方案，院方分開統計，
 * 所以 21 和 28 要先比對，剩下的才落回區間。
 */
export default function MonthlyStats() {
  const { data } = useDomainStore();
  const [year, setYear] = useState(() => data.demoAt.slice(0, 4));

  const { rows, totals } = buildMonthlyStats(data.cases, year);

  return (
    <CollapsibleSection id="case-monthly-stats" title="月統計表" summary={`${year} 年共 ${totals.total} 件`} bodyClassName="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm" data-no-print>
        <label className="flex items-center gap-2">
          統計年度
          <input
            aria-label="統計年度"
            type="number"
            min={2020}
            max={2100}
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="min-h-10 w-24 rounded-lg border border-stone-300 px-3 text-sm"
          />
        </label>
        <span className="text-stone-500">以下訂日統計，無下訂日則用簽約日或實際入住日。</span>
        <button type="button" className={buttonStyles({ size: "sm", className: "ml-auto" })} onClick={() => window.print()}>
          列印月統計表
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border-subtle py-4 sm:grid-cols-4">
        {[["年度接單", totals.total], ["其中已簽約", totals.signed], ["其中已入住", totals.admitted], ["其中已退房", totals.discharged]].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-stone-600">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-stone-800">{value}<span className="ml-1 text-sm font-normal text-stone-600">件</span></dd>
          </div>
        ))}
      </dl>
      <div role="region" aria-label="各月接單與房型天數統計" tabIndex={0} className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-right text-sm">
          <caption className="sr-only">{year} 年月統計表</caption>
          <thead className="bg-stone-50">
            <tr>
              {["月份", "接單數", "精緻房", "VIP", "VILLA", ...DAY_BUCKETS].map((label) => (
                <th key={label} scope="col" className={"whitespace-nowrap p-2 font-medium " + (label === "月份" ? "sticky left-0 z-10 bg-stone-50 text-left print:static" : "")}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month} className="border-t border-stone-200">
                <th scope="row" className="sticky left-0 bg-surface-raised p-2 text-left font-normal print:static">{row.month}</th>
                <td className="p-2 tabular-nums font-semibold">{row.total}</td>
                <td className="p-2 tabular-nums">{row.精緻}</td>
                <td className="p-2 tabular-nums">{row.VIP}</td>
                <td className="p-2 tabular-nums">{row.VILLA}</td>
                {DAY_BUCKETS.map((bucket) => (
                  <td key={bucket} className="p-2 tabular-nums">{row.buckets[bucket]}</td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border-subtle bg-brand-50 font-semibold">
            <tr>
              <th scope="row" className="sticky left-0 whitespace-nowrap bg-brand-50 p-2 text-left print:static">全年合計</th>
              {[totals.total, totals.精緻, totals.VIP, totals.VILLA, ...DAY_BUCKETS.map((bucket) => totals.buckets[bucket])].map((value, index) => (
                <td key={index} className="p-2 tabular-nums">{value}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs leading-5 text-stone-600">簽約、入住與退房數依所選年度接單案件的目前進度計算；無資料一律顯示 0。</p>
    </CollapsibleSection>
  );
}
