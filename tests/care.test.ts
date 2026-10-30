import assert from "node:assert/strict";
import { test } from "node:test";
import { MAMA_FORMS, BABY_FORMS, careForms } from "../src/lib/care/forms";
import { backfillDeadline, canEditCare, isBackfillExpired, moodNeedsAttention, needsFeedingReassessment, validateCareForm } from "../src/lib/care/rules";
import { CARE_SUBJECTS } from "../src/lib/care/subjects";
import { careActions, careStore } from "../src/lib/care/store";
import { setCurrentRole } from "../src/lib/roleStore";

const storage = new Map<string, string>();
const events = new EventTarget();
Object.defineProperty(globalThis, "window", { value: {
  localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) },
  addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events),
}, configurable: true });
const first = CARE_SUBJECTS.find((subject) => subject.kind === "mama" && !subject.historical)!;
const second = CARE_SUBJECTS.find((subject) => subject.kind === "mama" && !subject.historical && subject.caseId !== first.caseId)!;
function reset() { setCurrentRole("管理者"); careStore.reset(); }

test("v24 媽媽六項與寶寶八項功能皆有獨立表單", () => {
  assert.equal(MAMA_FORMS.length, 6); assert.equal(BABY_FORMS.length, 8);
  assert.notDeepEqual(MAMA_FORMS.find((form) => form.key === "ongoing"), MAMA_FORMS.find((form) => form.key === "record"));
});
test("哺餵再評估要求同頁媽媽護理紀錄，疼痛分數不得超界", () => {
  assert.equal(needsFeedingReassessment({ "feeding-0": "再評估" }), true);
  assert.ok(validateCareForm(BABY_FORMS.find((form) => form.key === "feeding")!, { date: "2026-10-16", time: "12:00", "feeding-0": "再評估" }).some((error) => error.includes("媽媽護理紀錄")));
  assert.ok(validateCareForm(MAMA_FORMS.find((form) => form.key === "ongoing")!, { date: "2026-10-16", time: "12:00", note: "紀錄", painScore: "11" }).some((error) => error.includes("疼痛分數")));
});
test("管理端自訂題目加入 v24 表單，必要題目同時受 action 驗證", () => {
  const form = careForms("mama", [{ id: "custom", section: "TOCC", label: "自訂追蹤", type: "text", options: [], required: true }])[0];
  assert.ok(form.sections.find((section) => section.label === "TOCC")!.fields.some((field) => field.key === "configured-custom"));
  assert.ok(validateCareForm(form, { note: "示範", date: "2026-10-17", time: "12:00" }).some((error) => error.includes("自訂追蹤")));
});
test("回補天數限主管設定，簽出附實際員工印章且工作位置不污染紀錄", () => {
  reset(); setCurrentRole("護理師 陳護理師"); assert.throws(() => careActions.backfillDays(7), /僅護理長/);
  setCurrentRole("管理者"); careActions.backfillDays(7); assert.equal(careStore.get().backfillDays, 7);
  careActions.open(first.id, "record"); const key = `${first.id}:record`;
  careActions.viewport(key, { sectionIndex: 1, scrollY: 500 }); careActions.change(key, { note: "印章測試" }); careActions.complete(key);
  assert.match(careStore.get().entries[0].staffStamp!.author, /管理者/);
  assert.equal(careStore.get().documents[key].viewport?.scrollY, 500);
  assert.equal(careStore.get().entries[0].values.scrollY, undefined);
});
test("心情門檻及回補期限端點", () => {
  assert.equal(moodNeedsAttention({ score: "12", question10: "1" }), false);
  assert.equal(moodNeedsAttention({ score: "13" }), true);
  assert.equal(moodNeedsAttention({ question10: "2" }), true);
  // 退房日起算到第 3 天的 23:59:59.999（台北時區），與退房當下的時分無關。
  const historical = { ...first, historical: true, dischargedAt: "2026-10-15T09:00:00+08:00" };
  assert.equal(backfillDeadline(historical, 3), "2026-10-18T15:59:59.999Z");
  assert.equal(backfillDeadline({ ...historical, dischargedAt: "2026-10-15T23:30:00+08:00" }, 3), "2026-10-18T15:59:59.999Z");
  assert.equal(isBackfillExpired(historical, 3, new Date("2026-10-18T23:59:59+08:00")), false);
  assert.equal(isBackfillExpired(historical, 3, new Date("2026-10-19T00:00:00+08:00")), true);
});
test("不同房只能一位編輯，解鎖後舊房無法寫入", () => {
  reset(); careActions.open(first.id, "record"); careActions.open(second.id, "record");
  const a = `${first.id}:record`; const b = `${second.id}:record`;
  assert.throws(() => careActions.change(b, { note: "不能寫入" }), /唯讀/);
  careActions.change(a, { note: "原房草稿" }); careActions.unlock(b);
  assert.throws(() => careActions.change(a, { note: "不能寫入" }), /唯讀/);
  assert.equal(careStore.get().documents[a].values.note, "原房草稿");
});
test("簽出只建立一筆歷史，完成表單唯讀且帶上一筆不複製簽名", () => {
  reset(); careActions.open(first.id, "record"); const key = `${first.id}:record`;
  careActions.change(key, { note: "已完成示範紀錄" }); careActions.sign(key, "data:image/png;base64,demo"); careActions.complete(key);
  assert.equal(careStore.get().entries.length, 1);
  assert.throws(() => careActions.complete(key), /已完成/);
  careActions.newEntry(key); careActions.carryLast(key);
  assert.equal(careStore.get().documents[key].values.note, "已完成示範紀錄");
  assert.equal(careStore.get().documents[key].signature, undefined);
  assert.equal(careStore.get().entries.length, 1);
});
test("護理指導單須保留媽媽、執行者與評值者三方簽名", () => {
  reset(); careActions.open(first.id, "guidance"); const key = `${first.id}:guidance`;
  careActions.change(key, { date: "2026-10-18" });
  careActions.signRole(key, "recipient", "data:image/png;base64,recipient");
  /* 照護簽出刻意保留硬擋（見 care/store.ts 的說明）：簽出會把這筆鎖成唯讀，
     放行會產生「缺簽名卻已簽出」且補不回來的表單。 */
  assert.throws(() => careActions.complete(key), /三方簽名/);
  careActions.signRole(key, "executor", "data:image/png;base64,executor");
  careActions.signRole(key, "evaluator", "data:image/png;base64,evaluator");
  careActions.complete(key);
  assert.deepEqual(Object.keys(careStore.get().entries[0].signatures!).sort(), ["evaluator", "executor", "recipient"]);
});
test("衛教師只能編輯指定寶寶表單，action 直接呼叫也不能繞過", () => {
  reset(); setCurrentRole("衛教師 琳雅");
  assert.equal(canEditCare("衛教師 琳雅", "baby", "feeding"), true);
  assert.equal(canEditCare("衛教師 琳雅", "baby", "growth"), false);
  const baby = CARE_SUBJECTS.find((subject) => subject.kind === "baby" && !subject.historical)!;
  assert.throws(() => careActions.open(baby.id, "growth"), /目前角色/);
  assert.throws(() => careActions.change(`${baby.id}:growth`, { weight: "3200" }), /目前角色/);
});
test("同房退房舊案與新住客的文件鍵不同，草稿關閉可恢復", () => {
  reset(); const old = CARE_SUBJECTS.find((subject) => subject.kind === "mama" && subject.historical && subject.room === first.room)!;
  assert.notEqual(old.id, first.id); assert.notEqual(old.caseId, first.caseId);
  careActions.open(first.id, "record"); const key = `${first.id}:record`;
  careActions.change(key, { note: "待補內容" }); careActions.save(key); careActions.close(key); careActions.open(first.id, "record");
  assert.equal(careStore.get().documents[key].values.note, "待補內容");
});
test("已簽出紀錄可再次修改與刪除，修改不另開新筆並留下修改者", () => {
  reset(); setCurrentRole("護理師 陳護理師");
  careActions.open(first.id, "record"); const key = `${first.id}:record`;
  careActions.change(key, { note: "第一版紀錄" }); careActions.complete(key);
  const before = careStore.get().entries.length;
  const entry = careStore.get().entries[0];
  assert.equal(entry.values.note, "第一版紀錄");

  careActions.editEntry(entry.id);
  assert.equal(careStore.get().documents[key].editingEntryId, entry.id);
  careActions.change(key, { note: "修正後紀錄" }); careActions.complete(key);
  const revised = careStore.get().entries.find((item) => item.id === entry.id)!;
  assert.equal(careStore.get().entries.length, before, "修改既有紀錄不應再新增一筆");
  assert.equal(revised.values.note, "修正後紀錄");
  assert.equal(revised.revisions?.length, 1);
  assert.match(revised.revisions![0].author, /陳護理師/);
  assert.equal(careStore.get().documents[key].editingEntryId, undefined);

  assert.throws(() => careActions.deleteEntry(entry.id, "  "), /原因/);
  careActions.deleteEntry(entry.id, "示範重複登錄");
  assert.equal(careStore.get().entries.some((item) => item.id === entry.id), false);
  assert.match(careStore.get().events[0].action, /刪除已簽出紀錄/);
});
test("逾期回補：主管可直接補，其餘角色須主管授權，完成紀錄以操作者署名", () => {
  reset(); const old = CARE_SUBJECTS.find((subject) => subject.kind === "mama" && subject.historical && subject.dischargedAt?.includes("10-10"))!;
  careActions.open(old.id, "record"); const key = `${old.id}:record`;
  setCurrentRole("護理師 陳護理師");
  assert.throws(() => careActions.change(key, { note: "補登" }), /回補期限/);
  assert.throws(() => careActions.authorize(old.id, "補登"), /護理長/);
  // 逾期後護理長不需先授權自己就能補登（客戶 2026-10-22 指示）。
  setCurrentRole("護理長 婉真"); careActions.change(key, { note: "主管直接補登" });
  assert.equal(careStore.get().documents[key].values.note, "主管直接補登");
  assert.throws(() => careActions.authorize(old.id, ""), /原因/);
  careActions.authorize(old.id, "示範主管授權");
  // 授權後，原本被擋的護理師也能補。
  setCurrentRole("護理師 陳護理師"); careActions.change(key, { note: "授權後補登" });
  setCurrentRole("護理長 婉真"); careActions.complete(key);
  assert.equal(careStore.get().entries[0].historical, true);
  assert.match(careStore.get().entries[0].author, /婉真/);
});
