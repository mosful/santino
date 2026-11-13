import assert from "node:assert/strict";
import { test } from "node:test";
import { GUIDANCE_WAYS, guidanceForm, guidanceGroups, guidanceKeys, guidanceOverdue } from "../src/lib/care/guidance";
import type { CareValues } from "../src/lib/care/types";

const extras = { version: 1 as const, mama: [], baby: [] };

test("媽媽 12 項、寶寶 30 項衛教依院方原表的分組與題序", () => {
  const mama = guidanceGroups("mama", extras);
  assert.deepEqual(mama.map((group) => group.label), ["入住24小時內"]);
  assert.equal(mama[0].items.length, 12);
  assert.equal(mama[0].items[0].label, "子宮復原說明及按摩方法指導");
  assert.equal(mama[0].items[11].label, "產後發燒");

  const baby = guidanceGroups("baby", extras);
  assert.deepEqual(baby.map((group) => group.label), ["個別衛教指導", "嬰兒居家照護指導"]);
  assert.deepEqual(baby.map((group) => group.items.length), [14, 16]);
  assert.equal(baby[0].items[0].label, "手擠奶技巧指導");
  assert.equal(baby[1].items[15].label, "新生兒沐浴");
  // 媽媽表四種指導方式、寶寶表六種，代號與原表一致。
  assert.equal(GUIDANCE_WAYS.mama.length, 4);
  assert.equal(GUIDANCE_WAYS.baby.length, 6);
  assert.equal(GUIDANCE_WAYS.baby[4], "5 團體衛教");
});

test("每個衛教項目都有指導方式、執行、簽名、評值與瞭解日期欄；寶寶表留備註", () => {
  const baby = guidanceForm("baby", extras);
  const keys = new Set(baby.sections[0].fields.map((field) => field.key));
  for (const group of guidanceGroups("baby", extras)) for (const item of group.items) {
    for (const key of Object.values(guidanceKeys(item.key))) assert.ok(keys.has(key), `缺少 ${key}`);
  }
  assert.ok(keys.has("baby_note"));
  assert.ok(!new Set(guidanceForm("mama", extras).sections[0].fields.map((field) => field.key)).has("baby_note"), "媽媽表本次不另加備註");
  // 一列八欄 × 30 項，加上表頭的執行日期與執行者及備註。
  assert.equal(baby.sections[0].fields.length, 30 * 8 + 3);
});

test("指導後超過七日沒評值才提醒，且不是只提醒勾過指導方式的那幾項", () => {
  const item = guidanceGroups("mama", extras)[0].items[0];
  const second = guidanceGroups("mama", extras)[0].items[1];
  const keys = guidanceKeys(item.key);
  const values: CareValues = { [keys.date]: "2026-11-01" };
  assert.deepEqual(guidanceOverdue("mama", values, "2026-11-08", undefined, extras).map((entry) => entry.key), []);
  assert.deepEqual(guidanceOverdue("mama", values, "2026-11-09", undefined, extras).map((entry) => entry.key), [item.key]);
  // 已有評值日期就不再提醒；沒有執行日期的項目也不提醒。
  assert.deepEqual(guidanceOverdue("mama", { ...values, [keys.evalDate]: "2026-11-05" }, "2026-11-20", undefined, extras), []);
  assert.deepEqual(guidanceOverdue("mama", { [guidanceKeys(second.key).evaluator]: "護理師" }, "2026-12-01", undefined, extras), []);
});

test("院方自行新增的項目接在最後一組，不插進原表題序", () => {
  const added = { version: 1 as const, mama: [{ key: "extra-abc", label: "自訂衛教項目" }], baby: [] };
  const groups = guidanceGroups("mama", added);
  assert.equal(groups[0].items.length, 13);
  assert.equal(groups[0].items[12].label, "自訂衛教項目");
  assert.equal(groups[0].items[0].label, "子宮復原說明及按摩方法指導");
  // 原表常數不被改到，下一次取用仍是 12 項。
  assert.equal(guidanceGroups("mama", extras)[0].items.length, 12);
});
