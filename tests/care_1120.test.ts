// 2026-11-20 會議需求（規格 v4 第十一節）：範圍輸入、清除連動、宮底、疼痛、覆蓋物、大便、紙本對應。
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAMA_FORMS } from "../src/lib/care/forms";
import { MAMA_DAILY } from "../src/lib/care/sheetDefinitions";
import { bloodPressureLooksWrong, linkCarePatch, parseCareRange, rowClearPatch, rowHasClear, validateCareForm } from "../src/lib/care/rules";
import { normalizeSheetValues } from "../src/lib/care/sheetValues";
import { guidanceForm } from "../src/lib/care/guidance";

const fields = MAMA_DAILY.sections.flatMap((section) => section.fields);
const field = (key: string) => fields.find((item) => item.key === key)!;
const base = { date: "2026-11-20", time: "09:00", note: "例行紀錄" };

test("G11 範圍輸入：單一數字或 2-3，全形自動轉換，擋前大後小與超出範圍", () => {
  assert.deepEqual(parseCareRange("2"), [2, 2]);
  assert.deepEqual(parseCareRange("2-3"), [2, 3]);
  assert.deepEqual(parseCareRange("２～３"), [2, 3]);
  assert.equal(parseCareRange("二"), null);
  for (const key of ["painScore", "pumping", "diarrheaTimes", "noStoolDays"]) assert.ok(field(key).range, `${key} 應可填範圍`);
  assert.deepEqual(validateCareForm(MAMA_DAILY, { ...base, painScore: "2-3", noStoolDays: "1-2" }), []);
  assert.ok(validateCareForm(MAMA_DAILY, { ...base, painScore: "3-2" }).some((message) => message.includes("不可大於")));
  assert.ok(validateCareForm(MAMA_DAILY, { ...base, painScore: "9-11" }).some((message) => message.includes("0至10")));
  assert.ok(validateCareForm(MAMA_DAILY, { ...base, painScore: "很痛" }).some((message) => message.includes("範圍")));
  const admission = MAMA_FORMS.find((form) => form.key === "admission")!;
  for (const key of ["painScore", "sitzBath"]) assert.ok(admission.sections.flatMap((section) => section.fields).find((item) => item.key === key)!.range, `入住評估 ${key} 應可填範圍`);
});

test("清除＝整列所有選項與文字框（日期時間、帶入欄位除外）；只有兩選一的列不放清除", () => {
  const row = ["painSites", "painScore", "painOther"].map(field);
  assert.deepEqual(rowClearPatch(row, { painSites: ["韌帶"], painScore: "2-3", painOther: "腰痠" }), { painSites: [], painScore: "", painOther: "" });
  const fundusRow = ["fundus", "fundusPosition", "contraction"].map(field);
  assert.deepEqual(rowClearPatch(fundusRow, { fundus: "二", contraction: "硬" }), { fundus: "", fundusPosition: "", contraction: "" });
  assert.ok(rowHasClear(fundusRow));
  assert.equal(rowHasClear([field("mobility")]), false, "活動只有兩選一");
  const head = ["delivery", "temperature", "bloodPressure"].map(field);
  assert.ok(!("delivery" in rowClearPatch(head, {})), "由入住評估帶入的生產方式不清");
  assert.ok(!("date" in rowClearPatch([{ key: "date", label: "日期", type: "date" }], {})), "日期不在清除範圍");
});

test("宮底：位置選項 U− 改為摸不到，選橫指即代表 U−；選 pelvic／摸不到清空橫指；補充欄移除", () => {
  assert.deepEqual(field("fundusPosition").options, ["摸不到", "pelvic"]);
  assert.deepEqual(linkCarePatch({ fundusPosition: "摸不到" }, { fundus: "二" }), { fundus: "二", fundusPosition: "" });
  assert.equal(normalizeSheetValues("mama", "ongoing", { fundusPosition: "U−", fundus: "二" }).fundusPosition, "");
  assert.deepEqual(linkCarePatch({ fundus: "二" }, { fundusPosition: "摸不到" }), { fundusPosition: "摸不到", fundus: "" });
  const admission = MAMA_FORMS.find((form) => form.key === "admission")!;
  for (const form of [MAMA_DAILY, admission]) assert.ok(!form.sections.some((section) => section.fields.some((item) => item.key === "fundusNote")), `${form.label} 不應有宮底補充`);
  assert.ok(!MAMA_DAILY.sections.some((section) => section.label === "入住護理紀錄" || section.label === "既有資料與補充評估"), "每日照護不顯示補充區段（G12）");
});

test("M10 大便：填次數自動勾選並排除衝突，取消勾選時清數字", () => {
  assert.deepEqual(linkCarePatch({ bowel: ["未解"], noStoolDays: "2" }, { diarrheaTimes: "2-3" }), { diarrheaTimes: "2-3", bowel: ["腹瀉"], noStoolDays: "" });
  assert.deepEqual(linkCarePatch({ bowel: ["未解"], noStoolDays: "2" }, { noStoolDays: "" }), { noStoolDays: "", bowel: [] });
  assert.deepEqual(linkCarePatch({ bowel: ["腹瀉"], diarrheaTimes: "3" }, { bowel: [] }), { bowel: [], diarrheaTimes: "" });
});

test("M08／M09 疼痛加韌帶、覆蓋物取消其它勾選；大便選項顯示文字", () => {
  assert.ok(field("painSites").options!.includes("韌帶"));
  assert.deepEqual(field("bowel").optionLabels, { 腹瀉: "腹瀉次數／天", 未解: "未解天數" }, "存值不變，只改顯示文字");
  assert.ok(!field("dressingTypes").options!.includes("其它"));
  // 產婦兩張表 2026-11-17 起改為系統原生列印，直接依欄位選項列出（含韌帶、摸不到），不再套掃描 PDF。
  assert.equal(MAMA_DAILY.paperTemplate, undefined);
});

test("M11 血壓只提醒格式；M12 生產方式由入住評估帶入不可改", () => {
  assert.equal(bloodPressureLooksWrong("130/80"), false);
  assert.equal(bloodPressureLooksWrong("130"), true);
  assert.ok(field("delivery").readOnlyHint);
});

test("G07 修訂：衛教表仍是單一產婦簽名的表單", () => {
  assert.equal(guidanceForm("mama").signature, true);
});
