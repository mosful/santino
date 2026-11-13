import assert from "node:assert/strict";
import { test } from "node:test";
import { BABY_DAILY, BABY_IO, MAMA_DAILY, MAMA_RECORD, RED_BOTTOM, SHIFTS, sectionRows } from "../src/lib/care/sheetDefinitions";
import { applyDailyDefaults, applyIoDefaults, growthDays, lastFeeding, latestMeasurement, roomingHours } from "../src/lib/care/summary";
import { validateCareForm } from "../src/lib/care/rules";
import type { CareEntry, CareValues } from "../src/lib/care/types";

const entry = (formKey: string, values: CareValues, id = Math.random().toString(36).slice(2)): CareEntry =>
  ({ id, subjectId: "baby-1", formKey, at: "2026-11-13T00:00:00.000Z", author: "示範護理師", values, historical: false });

test("每日照護保留院方紙本的評估項目、班別與新增的身長體重頭圍", () => {
  const fields = BABY_DAILY.sections.flatMap((section) => section.fields);
  const keys = fields.map((field) => field.key);
  for (const key of ["date", "stayDay", "shift", "time", "temperature", "pulse", "respiration", "activity", "sucking", "skin", "cord", "redBottom", "roomingStart", "roomingEnd", "roomingHours", "careIssue", "height", "weight", "head"]) {
    assert.ok(keys.includes(key), `每日照護缺少 ${key}`);
  }
  assert.deepEqual(fields.find((field) => field.key === "shift")!.options, SHIFTS);
  // 紅臀分級保留院方說明文字，不簡化成單一代號。
  assert.deepEqual(fields.find((field) => field.key === "redBottom")!.options, RED_BOTTOM);
  assert.equal(RED_BOTTOM.length, 4);
  assert.ok(!keys.includes("phototherapy"), "黃疸照光欄依新範本移整，不留在每日照護");
  // 紀錄日期與時間由表頭呈現，不重複出現在表格列裡。
  const visible = BABY_DAILY.sections.flatMap((section) => sectionRows(section).flatMap((row) => row.keys));
  assert.deepEqual([...new Set(visible)].sort(), keys.filter((key) => !["date", "time"].includes(key)).sort());
  assert.ok(keys.includes("date") && keys.includes("time"), "日期與時間仍要是表單欄位（必填驗證靠它）");
});

test("媽媽每日照護改名並讓可並存的狀況複選、宮底改選單", () => {
  assert.equal(MAMA_DAILY.key, "ongoing");
  assert.equal(MAMA_DAILY.label, "每日照護");
  const fields = MAMA_DAILY.sections.flatMap((section) => section.fields);
  for (const key of ["symptoms", "sleep", "mood", "painSites"]) assert.equal(fields.find((field) => field.key === key)!.type, "multiple", `${key} 應可複選`);
  const fundus = fields.find((field) => field.key === "fundus")!;
  assert.equal(fundus.type, "select");
  assert.deepEqual(fundus.options, ["一", "二", "三", "四", "五", "摸不到", "其他"]);
  // 互斥題不因「都複選」一句一起改掉。
  assert.equal(fields.find((field) => field.key === "contraction")!.type, "radio");
});

test("媽媽護理紀錄移除產後週數、分三類，且整筆不得全空", () => {
  const keys = MAMA_RECORD.sections.flatMap((section) => section.fields.map((field) => field.key));
  assert.ok(!keys.includes("week"));
  for (const key of ["executionNote", "continuousNote", "abnormal"]) assert.ok(keys.includes(key));
  const base = { date: "2026-11-13", time: "09:00" };
  assert.ok(validateCareForm(MAMA_RECORD, base).some((message) => message.includes("至少填寫一類")));
  assert.equal(validateCareForm(MAMA_RECORD, { ...base, continuousNote: "持續觀察乳房硬塊" }).length, 0);
  // 舊版只填一個 note 的紀錄仍算有內容，不會被新規則擋掉。
  assert.equal(validateCareForm(MAMA_RECORD, { ...base, note: "舊版紀錄內容" }).length, 0);
});

test("I/O 選自解帶出院方預設，改未解清掉矛盾的次數與性狀", () => {
  assert.deepEqual(applyIoDefaults({ urine: "自解" }, {}), { urine: "自解", urineTimes: "1", urineColor: "淡黃" });
  assert.deepEqual(applyIoDefaults({ urine: "自解" }, { urineTimes: "3", urineColor: "深黃" }), { urine: "自解" });
  assert.deepEqual(applyIoDefaults({ urine: "未解" }, { urineTimes: "3", urineColor: "深黃" }), { urine: "未解", urineTimes: "", urineColor: "" });
  assert.deepEqual(applyIoDefaults({ stool: "自解" }, {}), { stool: "自解", stoolTimes: "1" });
  // 大便量與性狀不自動認定。
  assert.equal(applyIoDefaults({ stool: "自解" }, {}).stoolAmount, undefined);
  assert.deepEqual(applyIoDefaults({ stool: "未解" }, { stoolTimes: "2", stoolAmount: "中量", stoolForm: ["綠滲便"] }), { stool: "未解", stoolTimes: "", stoolAmount: "", stoolForm: [] });
  // 其他欄位原樣通過。
  assert.deepEqual(applyIoDefaults({ bottleAmount: "60" }, {}), { bottleAmount: "60" });
  assert.ok(BABY_IO.sections[0].fields.find((field) => field.key === "stoolForm")!.options!.includes("綠滲便"));
});

test("成長日記同日多筆累加，糊便與滲便不因顏色漏計", () => {
  const entries = [
    entry("io", { date: "2026-11-13", time: "08:00", milkType: "母乳", bottleAmount: "40", leftMinutes: "10", rightMinutes: "5", urine: "自解", urineTimes: "2", stool: "自解", stoolTimes: "1", stoolForm: ["黃糊便"] }),
    entry("io", { date: "2026-11-13", time: "11:00", milkType: "配方奶", bottleAmount: "60", urine: "自解", urineTimes: "1", stool: "自解", stoolTimes: "2", stoolForm: ["綠滲便"] }),
    entry("daily", { date: "2026-11-13", shift: SHIFTS[0], weight: "3200", height: "50", head: "34" }),
    entry("daily", { date: "2026-11-14", shift: SHIFTS[0], weight: "3250" }),
  ];
  const [latest, first] = growthDays(entries);
  assert.equal(latest.date, "2026-11-14");
  assert.equal(first.date, "2026-11-13");
  assert.equal(first.breastMilk, 40);
  assert.equal(first.formula, 60);
  assert.equal(first.totalMilk, 100);
  assert.equal(first.breastMinutes, 15);
  assert.equal(first.urine, 3);
  assert.equal(first.stoolPaste, 1);
  assert.equal(first.stoolLeak, 2);
  assert.equal(first.weight, 3200);
  // 身長頭圍一週量一次，沒量的那天留白不補造。
  assert.equal(latest.height, undefined);
  assert.equal(latest.head, undefined);
  assert.equal(latest.weight, 3250);
});

test("量測與上一筆餵食只帶該帶的欄位", () => {
  const entries = [
    entry("io", { date: "2026-11-13", time: "11:00", milkType: "配方奶", bottleAmount: "60", urine: "自解", urineTimes: "1" }),
    entry("daily", { date: "2026-11-13", weight: "3200", head: "34" }),
  ];
  assert.deepEqual(latestMeasurement(entries, "2026-11-13"), { weight: "3200", head: "34" });
  assert.deepEqual(latestMeasurement(entries, "2026-11-12"), {});
  // 帶入只複製奶別與奶量，排尿與時間仍要按本次實況填。
  assert.deepEqual(lastFeeding(entries), { milkType: "配方奶", bottleAmount: "60" });
  assert.equal(lastFeeding([entry("daily", { date: "2026-11-13", weight: "3200" })]), undefined);
});

test("親子同室起訖都有才算時數，跨午夜不算成負數，缺一邊不假算", () => {
  assert.equal(roomingHours("09:00", "17:30"), 8.5);
  // 大夜班跨午夜。
  assert.equal(roomingHours("22:00", "02:00"), 4);
  assert.equal(roomingHours("09:00", ""), undefined);
  assert.equal(roomingHours("", "17:00"), undefined);
  assert.deepEqual(applyDailyDefaults({ roomingEnd: "17:00" }, { roomingStart: "09:00" }), { roomingEnd: "17:00", roomingHours: "8" });
  // 清掉其中一邊就把時數清掉，不留下對不上的數字。
  assert.deepEqual(applyDailyDefaults({ roomingStart: "" }, { roomingStart: "09:00", roomingEnd: "17:00", roomingHours: "8" }), { roomingStart: "", roomingHours: "" });
  // 與親子同室無關的欄位原樣通過。
  assert.deepEqual(applyDailyDefaults({ temperature: "36.8" }, {}), { temperature: "36.8" });
});
