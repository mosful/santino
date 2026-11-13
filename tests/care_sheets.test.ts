import assert from "node:assert/strict";
import { test } from "node:test";
import { BABY_ADMISSION, FEEDING_FORM, FEEDING_GROUPS, MAMA_ADMISSION, sectionRows } from "../src/lib/care/sheetDefinitions";
import { legacySheetFields, normalizeSheetValues } from "../src/lib/care/sheetValues";
import { needsFeedingReassessment, validateCareForm } from "../src/lib/care/rules";

test("入住評估的每個非時間欄位都有對應表格位置，列印涵蓋全部區段", () => {
  for (const form of [MAMA_ADMISSION, BABY_ADMISSION]) {
    const keys = form.sections.flatMap((section) => section.fields.map((field) => field.key));
    assert.equal(new Set(keys).size, keys.length, "欄位識別不可重複");
    for (const section of form.sections) {
      const visible = sectionRows(section).flatMap((row) => row.keys);
      assert.deepEqual([...new Set(visible)].sort(), section.fields.filter((field) => !["date", "time"].includes(field.key)).map((field) => field.key).sort());
    }
    assert.deepEqual(form.printGroups!.flat().sort(), form.sections.map((_, index) => index));
  }
});

test("B-R-E-A-S-T 完整26項且困難評估須有處理紀錄", () => {
  assert.equal(FEEDING_GROUPS.reduce((sum, group) => sum + group.rows.length, 0), 26);
  assert.equal(FEEDING_FORM.sections.flatMap((section) => section.fields).filter((field) => field.key.startsWith("breast-")).length, 26);
  const values = { date: "2026-11-13", time: "09:00", "breast-B1": "困難" };
  assert.equal(needsFeedingReassessment(values), true);
  assert.ok(validateCareForm(FEEDING_FORM, values).some((message) => message.includes("媽媽護理紀錄")));
  assert.equal(validateCareForm(FEEDING_FORM, { ...values, reassessmentNote: "已調整姿勢，持續觀察" }).length, 0);
});

test("舊草稿轉換不補造流產次、不覆蓋已填數值，未知內容保留", () => {
  const original = { parity: "G2P1", delivery: "C/S", allergy: "已填過敏資料", legacyDetail: "原補充" };
  const values = normalizeSheetValues("mama", "admission", original);
  assert.equal(values.gravida, "2"); assert.equal(values.para, "1"); assert.equal(values.abortus, undefined);
  assert.equal(values.delivery, "C/S 剖腹產"); assert.equal(original.delivery, "C/S");
  assert.equal(normalizeSheetValues("mama", "admission", { ...original, para: "2" }).para, "2");
  assert.ok(legacySheetFields(MAMA_ADMISSION, values).some((field) => field.key === "legacyDetail"));
  const baby = normalizeSheetValues("baby", "admission", { apgar: "8/9", apgar1: "7", cord: "濕潤" });
  assert.equal(baby.apgar1, "7"); assert.equal(baby.apgar5, "9"); assert.equal(baby.cord, "濕潤");
  assert.equal(normalizeSheetValues("baby", "admission", { apgar: "其他說明" }).apgar1, undefined);
});
