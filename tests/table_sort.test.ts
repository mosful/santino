import assert from "node:assert/strict";
import { test } from "node:test";
import { compareValues, sortRows } from "../src/components/ui/SortableHeader";

const rows = [
  { id: 1, name: "陳小姐", room: "502", days: 30, signDate: "2026-10-02" },
  { id: 2, name: "林小姐", room: "201", days: 21, signDate: "" },
  { id: 3, name: "王小姐", room: "1002", days: 7, signDate: "2026-09-14" },
];
const by = (sorted: typeof rows) => sorted.map((row) => row.id);

test("未指定排序時維持原順序，且不改到原陣列", () => {
  const original = [...rows];
  assert.deepEqual(by(sortRows(rows, null, (row, key) => (row as Record<string, unknown>)[key] )), [1, 2, 3]);
  sortRows(rows, { key: "name", direction: "asc" }, (row, key) => (row as Record<string, unknown>)[key]);
  assert.deepEqual(rows, original, "排序必須回傳新陣列，不可就地改動");
});

test("數字欄位按大小排、不按字串排", () => {
  const get = (row: (typeof rows)[number], key: string) => (row as unknown as Record<string, unknown>)[key];
  assert.deepEqual(by(sortRows(rows, { key: "days", direction: "asc" }, get)), [3, 2, 1]);
  assert.deepEqual(by(sortRows(rows, { key: "days", direction: "desc" }, get)), [1, 2, 3]);
  // 房號是字串但要照數字大小：1002 要排在 502 後面，不是因為開頭的 1 排最前。
  assert.deepEqual(by(sortRows(rows, { key: "room", direction: "asc" }, get)), [2, 1, 3]);
});

test("空值一律排最後，遞減時也不會翻到最前面", () => {
  const get = (row: (typeof rows)[number], key: string) => (row as unknown as Record<string, unknown>)[key];
  assert.deepEqual(by(sortRows(rows, { key: "signDate", direction: "asc" }, get)), [3, 1, 2]);
  assert.deepEqual(by(sortRows(rows, { key: "signDate", direction: "desc" }, get)), [1, 3, 2]);
});

test("中文姓名依筆畫以外的在地排序規則比較，不是用 UTF-16 碼位", () => {
  assert.ok(compareValues("林", "陳") !== 0);
  assert.equal(compareValues("第2週", "第10週") < 0, true, "含數字的字串要照數字大小");
  assert.equal(compareValues(3, 12) < 0, true);
});

test("可自訂取值，讓合併顯示或計算欄位也能排序", () => {
  const get = (row: (typeof rows)[number], key: string) => key === "combined" ? `${row.room}-${row.name}` : (row as unknown as Record<string, unknown>)[key];
  assert.deepEqual(by(sortRows(rows, { key: "combined", direction: "asc" }, get)), [2, 1, 3]);
});
