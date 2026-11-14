import assert from "node:assert/strict";
import { test } from "node:test";
import { caseGiftDays, casePrice, casePriceBreakdown, freeDays } from "../src/lib/domain/rules";
import { DEFAULT_CHECKOUT_ITEMS } from "../src/lib/domain/checkout";
import { CASE_DOCS, docValues } from "../src/lib/domain/caseDocs";
import { MODULES } from "../src/lib/modules";
import type { CaseRecord } from "../src/lib/domain/types";
import { blankCase } from "../src/lib/demo/domainSeed";

const base = { roomType: "精緻" as const, hospital: "璟馨婦幼醫院", priceClass: "一般", addOns: [] };

test("贈送天數未指定沿用自動建議，指定後以該案為準且可填 0", () => {
  assert.equal(caseGiftDays({ days: 28 }), 2);
  assert.equal(caseGiftDays({ days: 21 }), 1);
  assert.equal(caseGiftDays({ days: 14 }), 0);
  // 住同樣天數的兩個案件可以分別不贈送或指定贈送。
  assert.equal(caseGiftDays({ days: 28, giftDays: 0 }), 0);
  assert.equal(caseGiftDays({ days: 28, giftDays: 3 }), 3);
  // null 代表留白，仍走自動建議。
  assert.equal(caseGiftDays({ days: 28, giftDays: null }), freeDays(28));
});

test("指定贈送天數會改到實收天數與金額，不影響另一案", () => {
  const auto = casePriceBreakdown({ ...base, days: 28 });
  const none = casePriceBreakdown({ ...base, days: 28, giftDays: 0 });
  assert.equal(auto.giftedDays, 2);
  assert.equal(auto.paidDays, 26);
  assert.equal(none.giftedDays, 0);
  assert.equal(none.paidDays, 28);
  assert.equal(none.total - auto.total, (auto.baseDaily + auto.hospitalDaily) * 2);
  assert.equal(casePrice({ ...base, days: 28 }), auto.total);
});

test("參觀階段天數留 0 不會算出負數或贈送天數", () => {
  const breakdown = casePriceBreakdown({ ...base, days: 0 });
  assert.equal(breakdown.paidDays, 0);
  assert.equal(breakdown.giftedDays, 0);
  assert.equal(breakdown.total, 0);
});

test("返家指導單不再要求歸還母乳提袋，其餘品項保留", () => {
  assert.ok(!DEFAULT_CHECKOUT_ITEMS.some((item) => item.name.includes("母乳提袋")));
  assert.ok(DEFAULT_CHECKOUT_ITEMS.length > 0, "其他歸還品項仍須保留");
});

test("坐月子所需物品初次開啟全選，取消後存檔不會被勾回來", () => {
  const doc = CASE_DOCS.find((item) => item.sections.some((section) => section.fields.some((field) => field.key === "supplies")))!;
  const record = { id: "case-1", name: "王OO媽媽", phone: "", documents: undefined } as unknown as CaseRecord;
  const supplies = doc.sections.flatMap((section) => section.fields).find((field) => field.key === "supplies")!;
  assert.deepEqual(docValues(record, doc).supplies.split("、"), supplies.options);
  const saved = { ...record, documents: { [doc.key]: { values: { supplies: "" }, savedAt: "", actor: "" } } } as unknown as CaseRecord;
  assert.equal(docValues(saved, doc).supplies, "");
});

test("一般導覽不再出現獨立套餐速算入口，案件清單仍在", () => {
  const counter = MODULES.find((module) => module.no === "1")!;
  const visible = (counter.subItems ?? []).filter((item) => !item.hidden).map((item) => item.key);
  assert.ok(!visible.includes("quote"));
  assert.ok(visible.includes("cases"));
  // 路由保留，只是不列在選單；需求明確要求不得一併刪掉案件計價。
  assert.ok((counter.subItems ?? []).some((item) => item.key === "quote" && item.href === "/quote/"));
});

test("案件共同資料（胎次）晚於單據填寫時仍會帶入，刻意清空的其他欄位不被蓋回", () => {
  const tcm = CASE_DOCS.find((doc) => doc.key === "tcm-survey")!;
  const prenatal = CASE_DOCS.find((doc) => doc.key === "prenatal-care")!;
  const record = { ...blankCase("parity-carry"), name: "示範", parity: "第 2 胎", documents: { "tcm-survey": { values: { parity: "", gyn: "" }, savedAt: "", actor: "" }, "prenatal-care": { values: { supplies: "" }, savedAt: "", actor: "" } } } as CaseRecord;
  assert.equal(docValues(record, tcm).parity, "第 2 胎");
  assert.equal(docValues(record, prenatal).supplies, "");
  assert.equal(docValues(record, CASE_DOCS.find((doc) => doc.key === "baby-notice")!).birthOrder, "第 2 胎");
});
