import type { CaseRecord } from "./types";

export const DAY_BUCKETS = ["0-14 天", "15-21 天", "21+1 天", "28+2 天", "30 天", "其他天數"] as const;
type DayBucket = (typeof DAY_BUCKETS)[number];
type MonthlyRow = {
  month: string;
  total: number;
  精緻: number;
  VIP: number;
  VILLA: number;
  signed: number;
  admitted: number;
  discharged: number;
  buckets: Record<DayBucket, number>;
};

/** 21／28 天是獨立的贈送方案，先比對才不會重複計入區間。 */
function bucketOf(days: number): DayBucket {
  if (days === 21) return "21+1 天";
  if (days === 28) return "28+2 天";
  if (days === 30) return "30 天";
  if (days <= 14) return "0-14 天";
  if (days <= 21) return "15-21 天";
  return "其他天數";
}

function emptyRow(month: string): MonthlyRow {
  return { month, total: 0, 精緻: 0, VIP: 0, VILLA: 0, signed: 0, admitted: 0, discharged: 0, buckets: Object.fromEntries(DAY_BUCKETS.map((bucket) => [bucket, 0])) as Record<DayBucket, number> };
}

/** 沿用下訂日優先、簽約日／實際入住日備援的口徑，進度數計算同一批接單案件。 */
export function buildMonthlyStats(cases: readonly CaseRecord[], year: string) {
  const rows = Array.from({ length: 12 }, (_, index) => {
    const row = emptyRow(`${index + 1} 月`);
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    for (const record of cases) {
      if (!(record.orderDate || record.signedDate || record.actualAdmission || "").startsWith(month)) continue;
      row.total++;
      row[record.roomType]++;
      row.buckets[bucketOf(record.days)]++;
      if (record.signed) row.signed++;
      if (record.actualAdmission) row.admitted++;
      if (record.dischargedAt) row.discharged++;
    }
    return row;
  });
  const totals = emptyRow("全年合計");
  for (const row of rows) {
    for (const key of ["total", "精緻", "VIP", "VILLA", "signed", "admitted", "discharged"] as const) totals[key] += row[key];
    for (const bucket of DAY_BUCKETS) totals.buckets[bucket] += row.buckets[bucket];
  }
  return { rows, totals };
}
