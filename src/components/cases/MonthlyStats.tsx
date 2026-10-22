"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { useDomainStore } from "@/lib/demo/domainStore";
import type { CaseRecord } from "@/lib/domain/types";

/**
 * 月統計表（客戶手冊第 47 頁的紙本表格）。
 *
 * 欄位照抄：月份 × 接單數、精緻房、VIP、VILLA、0-14 天、15-21 天、21+1 天、28+2 天、30 天、其他天數。
 * ⚠️ 天數級距不是連續區間：21 天與 28 天是「贈 1 天／贈 2 天」的方案，院方分開統計，
 * 所以 21 和 28 要先比對，剩下的才落回區間。
 */
const DAY_BUCKETS = ["0-14 天", "15-21 天", "21+1 天", "28+2 天", "30 天", "其他天數"] as const;
type DayBucket = (typeof DAY_BUCKETS)[number];

function bucketOf(days: number): DayBucket {
  if (days === 21) return "21+1 天";
  if (days === 28) return "28+2 天";
  if (days === 30) return "30 天";
  if (days <= 14) return "0-14 天";
  if (days <= 21) return "15-21 天";
  return "其他天數";
}

/** 統計基準日：有下訂日用下訂日，否則用簽約日或實際入住日——都沒有就不計入。 */
function statDate(record: CaseRecord) {
  return record.orderDate || record.signedDate || record.actualAdmission || "";
}

export default function MonthlyStats() {
  const { data } = useDomainStore();
  const [year, setYear] = useState(() => data.demoAt.slice(0, 4));

  const rows = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    const cases = data.cases.filter((record) => statDate(record).startsWith(month));
    const buckets = Object.fromEntries(DAY_BUCKETS.map((bucket) => [bucket, 0])) as Record<DayBucket, number>;
    for (const record of cases) buckets[bucketOf(record.days)] += 1;
    return {
      month: `${index + 1} 月`,
      total: cases.length,
      精緻: cases.filter((record) => record.roomType === "精緻").length,
      VIP: cases.filter((record) => record.roomType === "VIP").length,
      VILLA: cases.filter((record) => record.roomType === "VILLA").length,
      buckets,
    };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <CollapsibleSection id="case-monthly-stats" title="月統計表" summary={`${year} 年共 ${total} 件`} bodyClassName="space-y-3">
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-stone-50">
            <tr>
              {["月份", "接單數", "精緻房", "VIP", "VILLA", ...DAY_BUCKETS].map((label) => (
                <th key={label} className="whitespace-nowrap p-2 font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month} className="border-t border-stone-200">
                <td className="p-2">{row.month}</td>
                <td className="p-2 tabular-nums font-medium">{row.total || ""}</td>
                <td className="p-2 tabular-nums">{row.精緻 || ""}</td>
                <td className="p-2 tabular-nums">{row.VIP || ""}</td>
                <td className="p-2 tabular-nums">{row.VILLA || ""}</td>
                {DAY_BUCKETS.map((bucket) => (
                  <td key={bucket} className="p-2 tabular-nums">{row.buckets[bucket] || ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
