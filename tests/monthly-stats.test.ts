import { test } from "node:test";
import assert from "node:assert/strict";
import { blankCase } from "../src/lib/demo/domainSeed";
import { buildMonthlyStats, DAY_BUCKETS } from "../src/lib/domain/monthlyStats";
import type { CaseRecord } from "../src/lib/domain/types";

const record = (id: string, patch: Partial<CaseRecord>) => ({ ...blankCase(id), ...patch });

test("十二個月份與全年合計的空資料都保留數字 0", () => {
  const { rows, totals } = buildMonthlyStats([], "2026");
  assert.equal(rows.length, 12);
  for (const row of [...rows, totals]) {
    for (const key of ["total", "精緻", "VIP", "VILLA", "signed", "admitted", "discharged"] as const) assert.equal(row[key], 0);
    for (const bucket of DAY_BUCKETS) assert.equal(row.buckets[bucket], 0);
  }
});

test("下訂日優先、簽約日與入住日備援，跨年度不重複計入", () => {
  const cases = [
    record("ordered", { orderDate: "2026-01-05", signedDate: "2026-02-01", signed: true, actualAdmission: "2027-01-01" }),
    record("signed", { signedDate: "2026-02-05", signed: true }),
    record("admitted", { actualAdmission: "2026-03-01", dischargedAt: "2026-04-01" }),
    record("undated", {}),
    record("other-year", { orderDate: "2025-12-31", actualAdmission: "2026-01-01" }),
  ];
  const { rows, totals } = buildMonthlyStats(cases, "2026");
  assert.deepEqual(rows.slice(0, 3).map((row) => row.total), [1, 1, 1]);
  assert.equal(totals.total, 3);
  assert.equal(totals.signed, 2);
  assert.equal(totals.admitted, 2);
  assert.equal(totals.discharged, 1);
  assert.equal(buildMonthlyStats(cases, "2099").totals.total, 0);
});

test("房型與住房天數的全年加總一致，21／28／30 天不重複分組", () => {
  const cases = [14, 20, 21, 28, 30, 24].map((days, index) => record(`bucket-${index}`, {
    orderDate: `2026-${index < 3 ? "01" : "02"}-10`,
    roomType: (["精緻", "VIP", "VILLA"] as const)[index % 3],
    days,
  }));
  const { rows, totals } = buildMonthlyStats(cases, "2026");
  assert.equal(totals.total, 6);
  assert.deepEqual([totals.精緻, totals.VIP, totals.VILLA], [2, 2, 2]);
  assert.deepEqual(DAY_BUCKETS.map((bucket) => totals.buckets[bucket]), [1, 1, 1, 1, 1, 1]);
  for (const row of [...rows, totals]) {
    assert.equal(row.total, row.精緻 + row.VIP + row.VILLA);
    assert.equal(row.total, Object.values(row.buckets).reduce((sum, count) => sum + count, 0));
  }
});
