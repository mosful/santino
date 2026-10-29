import assert from "node:assert/strict";
import { test } from "node:test";
import { domainStore, caseActions } from "../src/lib/demo/domainStore";
import { setCurrentRole } from "../src/lib/roleStore";
import { caseBalance, casePrice, dailyCharges, freeDays, roomDailyRate } from "../src/lib/domain/rules";
import { babycamActions, canBabycamSection, canEditBabycamSection } from "../src/lib/babycam/actions";
import { deriveDemoLight, effectiveViewingWindow, viewingBlock } from "../src/lib/babycam/viewing";
import { enterViewer } from "../src/lib/babycam/viewerSession";
import { toBrowserXlsx } from "../src/lib/babycam/exports";
import { roleTaskCategories, taskActions } from "../src/lib/domain/tasks";
import { caseDoc, docValues } from "../src/lib/domain/caseDocs";
import { lightChannels } from "../src/lib/babycam/lights";
import { contractSettingActions } from "../src/lib/domain/contractSettings";
import { cameraTimeRows } from "../src/lib/babycam/cameraTime";
import { toCsv } from "../src/lib/babycam/csv";
import { babyDisplayName } from "../src/lib/babycam/wristband";
import { activeDisinfection } from "../src/lib/babycam/disinfection";
import { caseTransitionErrors } from "../src/lib/domain/rules";

const storage = new Map<string, string>(); const events = new EventTarget();
Object.defineProperty(globalThis, "window", { value: { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) }, dispatchEvent: events.dispatchEvent.bind(events), addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) }, configurable: true });
function reset() { setCurrentRole("管理者"); domainStore.reset(); }
function readyCase() {
  const id = caseActions.create("示範媽媽", "展示手機-新案");
  caseActions.update(id, { visitDate: "2026-10-20" }); caseActions.advance(id);
  caseActions.update(id, { visitStatus: "已出席", tasting: true }); caseActions.advance(id);
  caseActions.update(id, { contractNo: "展示收字9999", deposit: 30000 }); caseActions.advance(id);
  caseActions.update(id, { signedDate: "2026-10-20", reviewStart: "2026-10-15", milkConsent: true }); caseActions.sign(id, "data:image/png;base64,demo"); caseActions.advance(id);
  return id;
}
test("案件從預約到實際入住，共用媽媽資料與待指派視訊只建立一次", () => {
  reset(); const id = readyCase(); caseActions.update(id, { actualAdmission: "2026-10-21", room: "303" }); caseActions.advance(id);
  assert.equal(domainStore.get().cases.find((item) => item.id === id)!.stage, 5);
  assert.equal(domainStore.get().subjects.filter((item) => item.caseId === id && item.kind === "mama").length, 1);
  assert.equal(domainStore.get().bindings.filter((item) => item.caseId === id).length, 1);
  caseActions.update(id, { name: "更名示範媽媽" });
  assert.equal(domainStore.get().subjects.find((item) => item.caseId === id)!.name, "更名示範媽媽");
  assert.match(domainStore.get().cases.find((item) => item.id === id)!.contractSnapshot!, /示範媽媽/);
  assert.doesNotMatch(domainStore.get().cases.find((item) => item.id === id)!.contractSnapshot!, /更名/);
});
test("強制結案不退房，重開不重建原觀看授權", () => {
  reset(); const record = domainStore.get().cases.find((item) => item.stage === 5)!;
  const binding = domainStore.get().bindings.find((item) => item.caseId === record.id)!;
  caseActions.forceClose(record.id, "展示行政結案");
  assert.equal(domainStore.get().bindings.find((item) => item.id === binding.id)!.ended, false);
  assert.equal(domainStore.get().cases.find((item) => item.id === record.id)!.dischargedAt, "");
  caseActions.reopen(record.id, "展示重開");
  assert.equal(domainStore.get().cases.find((item) => item.id === record.id)!.stage, 5);
  assert.equal(domainStore.get().bindings.find((item) => item.id === binding.id)!.internalTicket, binding.internalTicket);
});
test("重複合約變更只計新增差額，試吃只折一次", () => {
  reset(); const record = domainStore.get().cases.find((item) => item.stage === 5)!;
  caseActions.change(record.id, 25, "精緻", "展示續住 1 天");
  caseActions.change(record.id, 26, "精緻", "展示再續住 1 天");
  const current = domainStore.get().cases.find((item) => item.id === record.id)!;
  assert.equal(current.ledger.reduce((sum, item) => sum + item.amount, 0), 15000);
  assert.equal(caseBalance(current), current.quotedAmount + 15000 - current.deposit);
});
test("換房同步照護與視訊、原快照不變、舊連結作廢", () => {
  reset(); const record = domainStore.get().cases.find((item) => item.stage === 5)!;
  const binding = domainStore.get().bindings.find((item) => item.caseId === record.id)!;
  caseActions.change(record.id, record.days, record.roomType, "展示換房", "303");
  const data = domainStore.get(); const current = data.cases.find((item) => item.id === record.id)!;
  assert.equal(current.room, "303"); assert.equal(current.contractSnapshot, record.contractSnapshot);
  assert.ok(data.subjects.filter((item) => item.caseId === record.id && !item.historical).every((item) => item.room === "303"));
  assert.equal(data.bindings.find((item) => item.id === binding.id)!.room, "303");
  assert.notEqual(data.bindings.find((item) => item.id === binding.id)!.familyTicket, binding.familyTicket);
  assert.throws(() => enterViewer("family", binding.phone, binding.passcode, binding.familyTicket, "old-room"), /不正確/);
});
test("逐日帳加總一致，過去帳務須主管原因，重複修正不重複計帳", () => {
  reset(); const record = domainStore.get().cases.find((item) => item.stage === 5)!;
  assert.throws(() => caseActions.charge(record.id, "急診展示費", 500, "2026-10-01"), /主管授權/);
  caseActions.charge(record.id, "急診展示費", 500, "2026-10-01", "急診補列展示");
  const entry = domainStore.get().cases.find((item) => item.id === record.id)!.ledger[0];
  setCurrentRole("櫃台"); assert.throws(() => caseActions.adjustCharge(record.id, entry.id, 700, "修正"), /主管授權/);
  setCurrentRole("管理者"); caseActions.adjustCharge(record.id, entry.id, 700, "急診核對"); caseActions.adjustCharge(record.id, entry.id, 700, "相同金額");
  const current = domainStore.get().cases.find((item) => item.id === record.id)!;
  assert.equal(current.ledger.length, 2); assert.equal(current.ledger[0].amount, 500);
  assert.equal(dailyCharges(current).reduce((sum, item) => sum + item.amount, 0), current.quotedAmount + 700);
});
test("房價與贈送天數依客戶手冊價目表（櫃台 PDF 第 39、47 頁）", () => {
  assert.equal(roomDailyRate("精緻", "璟馨婦幼醫院（院內）"), 7500);
  assert.equal(roomDailyRate("精緻", "成大"), 7650);
  assert.equal(roomDailyRate("精緻", "其他"), 7800);
  assert.equal(roomDailyRate("VIP", "詠馨婦幼中心（院內）"), 8600);
  assert.equal(roomDailyRate("VIP", "奇美"), 8750);
  assert.equal(roomDailyRate("VIP", "其他"), 8900);
  assert.equal(roomDailyRate("VILLA", "璟馨婦幼醫院（院內）"), 9600);
  assert.equal(roomDailyRate("VILLA", "其他"), 10000);
  // 舊 localStorage 與舊文件的寫法也要能歸到同一級距。
  assert.equal(roomDailyRate("VIP", "園內"), 8600);
  assert.equal(roomDailyRate("VIP", "成大／奇美"), 8750);

  assert.equal(freeDays(20), 0);
  assert.equal(freeDays(21), 1);
  assert.equal(freeDays(27), 1);
  assert.equal(freeDays(28), 2);
  assert.equal(freeDays(30), 2);

  // 21 天 VIP 院內：贈 1 天，付費 20 天。
  assert.equal(casePrice({ roomType: "VIP", days: 21, hospital: "璟馨婦幼醫院（院內）", priceClass: "一般", addOns: [] }), 20 * 8600);
  // 員工價九折。
  assert.equal(casePrice({ roomType: "精緻", days: 21, hospital: "其他", priceClass: "員工價", addOns: [] }), Math.round(7800 * 20 * 0.9));
});
test("入住前時間軸、分次付款與返家檢查保留稽核", () => {
  reset(); const id = readyCase();
  caseActions.timeline(id, "prenatalContactDone", true);
  caseActions.timeline(id, "dischargeNoticeDone", true);
  caseActions.update(id, { actualAdmission: "2026-10-21", room: "303" }); caseActions.advance(id);
  const before = caseBalance(domainStore.get().cases.find((item) => item.id === id)!);
  caseActions.payment(id, 5000, "轉帳", "2026-10-21", "入住尾款第一筆");
  const paid = domainStore.get().cases.find((item) => item.id === id)!;
  assert.equal(caseBalance(paid), before - 5000);
  assert.match(paid.payments[0].actor, /管理者/);
  caseActions.advance(id);
  caseActions.checkoutProgress(id, true);
  caseActions.update(id, { checkoutNote: "其餘項目持續確認" });
  // 29 項逐項檢查，少一項就不能完成。
  assert.throws(() => caseActions.completeCheckout(id), /尚未檢查/);
  caseActions.inspect(id, "吹風機", "異常", "風量變小，已報修");
  caseActions.inspectAllNormal(id);
  caseActions.completeCheckout(id);
  const current = domainStore.get().cases.find((item) => item.id === id)!;
  assert.ok(current.checkoutCompletedAt);
  assert.ok(current.log.some((entry) => entry.text.includes("返家檢查表完成")));
});
test("手動待辦可編輯與刪除，自動產生的待辦不可改", () => {
  reset();
  taskActions.add("2026-10-25", "關懷／提醒", "302 房產前關懷電話");
  const task = domainStore.get().tasks.at(-1)!;
  taskActions.update(task.id, "2026-10-26", "關懷／提醒", "改為 10/26 致電");
  const updated = domainStore.get().tasks.find((item) => item.id === task.id)!;
  assert.equal(updated.date, "2026-10-26");
  assert.equal(updated.title, "改為 10/26 致電");
  assert.throws(() => taskActions.update("case-demo-visit:參觀", "2026-10-26", "參觀", "亂改"), /只有手動新增/);
  assert.throws(() => taskActions.remove("case-demo-visit:參觀"), /只有手動新增/);
  taskActions.remove(task.id);
  assert.equal(domainStore.get().tasks.some((item) => item.id === task.id), false);
});
test("付款紀錄可修改與刪除，必填原因且異動寫入案件歷程", () => {
  reset(); const id = readyCase();
  caseActions.update(id, { actualAdmission: "2026-10-21", room: "303" }); caseActions.advance(id);
  caseActions.payment(id, 5000, "轉帳", "2026-10-21", "入住尾款第一筆");
  const paymentId = domainStore.get().cases.find((item) => item.id === id)!.payments[0].id;
  const balanceAfterPay = caseBalance(domainStore.get().cases.find((item) => item.id === id)!);

  assert.throws(() => caseActions.updatePayment(id, paymentId, 8000, "現金", "2026-10-22", "改收現金", " "), /原因/);
  caseActions.updatePayment(id, paymentId, 8000, "現金", "2026-10-22", "改收現金", "櫃台登錄金額有誤");
  const edited = domainStore.get().cases.find((item) => item.id === id)!;
  assert.equal(edited.payments.length, 1);
  assert.equal(edited.payments[0].amount, 8000);
  assert.equal(caseBalance(edited), balanceAfterPay - 3000);
  assert.ok(edited.log.some((entry) => entry.text.includes("修改付款紀錄") && entry.text.includes("櫃台登錄金額有誤")));

  assert.throws(() => caseActions.removePayment(id, paymentId, ""), /原因/);
  caseActions.removePayment(id, paymentId, "重複登錄");
  const removed = domainStore.get().cases.find((item) => item.id === id)!;
  assert.equal(removed.payments.length, 0);
  assert.ok(removed.log.some((entry) => entry.text.includes("刪除付款紀錄") && entry.text.includes("重複登錄")));
});
test("返家指導單：未歸還品項與應付款項併入帳務，只寫一筆", () => {
  reset(); const id = readyCase();
  caseActions.update(id, { actualAdmission: "2026-10-21", room: "303" }); caseActions.advance(id); caseActions.advance(id);
  const before = caseBalance(domainStore.get().cases.find((item) => item.id === id)!);

  // 房卡發 2 張只還 1 張（100 元）＋黃疸照光 100、中醫 4,800。
  caseActions.returnItem(id, "roomcard", 2, 1);
  assert.throws(() => caseActions.returnItem(id, "roomcard", 2, 3), /歸還不可大於發出/);
  caseActions.returnCharge(id, { jaundice: 100, chinese: 4800 });
  assert.throws(() => caseActions.returnCharge(id, { hair: -1 }), /0 以上/);
  caseActions.chargeReturnTotal(id);

  const record = domainStore.get().cases.find((item) => item.id === id)!;
  assert.equal(caseBalance(record), before + 100 + 100 + 4800);
  assert.equal(record.ledger.filter((entry) => entry.id === record.returnChargeEntryId).length, 1);
  assert.throws(() => caseActions.chargeReturnTotal(id), /不需重複寫入/);

  // 金額改了就更新同一筆，不會累加第二筆。
  caseActions.returnCharge(id, { hair: 450 });
  caseActions.chargeReturnTotal(id);
  const updated = domainStore.get().cases.find((item) => item.id === id)!;
  assert.equal(updated.ledger.filter((entry) => entry.label.includes("返家指導單")).length, 1);
  assert.equal(caseBalance(updated), before + 100 + 100 + 4800 + 450);
});
test("返家檢查表 29 項逐項確認，異常必填原因並寫進歷程", () => {
  reset(); const id = readyCase();
  caseActions.update(id, { actualAdmission: "2026-10-21", room: "303" }); caseActions.advance(id); caseActions.advance(id);
  assert.throws(() => caseActions.inspect(id, "不存在的項目", "正常"), /不是返家檢查表的項目/);
  assert.throws(() => caseActions.inspect(id, "免治馬桶", "異常", " "), /原因/);
  caseActions.inspect(id, "免治馬桶", "異常", "沖水無力");
  assert.throws(() => caseActions.completeCheckout(id), /尚未檢查/);
  caseActions.inspectAllNormal(id);
  caseActions.completeCheckout(id);
  const record = domainStore.get().cases.find((item) => item.id === id)!;
  assert.equal(record.roomInspection!["免治馬桶"].status, "異常");
  assert.equal(record.roomInspection!["吹風機"].status, "正常");
  assert.ok(record.log.some((entry) => entry.text.includes("免治馬桶（沖水無力）")));
});
test("櫃台單據自動帶入案件資料，存檔即完成入住前時間軸項目", () => {
  reset(); const id = readyCase();
  caseActions.update(id, { actualAdmission: "2026-10-21", room: "303" });
  const record = () => domainStore.get().cases.find((item) => item.id === id)!;
  const doc = caseDoc("security-notice")!;
  const prefilled = docValues(record(), doc);
  assert.equal(prefilled.room, "303");
  assert.equal(prefilled.motherName, "示範媽媽");
  assert.match(prefilled.stay, /^2026-10-21 ～ /);

  assert.equal(record().preAdmissionPapersDone, false);
  caseActions.saveDocument(id, "security-notice", { ...prefilled, fatherName: "示範爸爸", carNo: "ABC-1234" });
  assert.equal(record().preAdmissionPapersDone, true);
  assert.equal(record().documents!["security-notice"].values.carNo, "ABC-1234");
  assert.ok(record().log.some((entry) => entry.text.includes("保存入住資訊－保全部")));
  assert.throws(() => caseActions.saveDocument(id, "no-such-doc", {}), /找不到這張單據/);

  // 繳款通知單的餘額直接帶案件應收，不用再算一次。
  const payment = docValues(record(), caseDoc("payment-notice")!);
  assert.equal(Number(payment.balance), Math.max(0, caseBalance(record())));
});
test("逐日明細可指定贈送日，折讓併入帳務且原房費保留", () => {
  reset(); const id = readyCase();
  caseActions.update(id, { actualAdmission: "2026-10-21", room: "303" }); caseActions.advance(id);
  const record = () => domainStore.get().cases.find((item) => item.id === id)!;
  const before = caseBalance(record());
  const target = dailyCharges(record()).find((row) => row.amount > 0 && row.label.includes("原合約"))!;

  caseActions.toggleGiftDay(id, target.date);
  assert.equal(caseBalance(record()), before - target.amount);
  assert.ok(dailyCharges(record()).some((row) => row.date === target.date && row.amount === target.amount), "原房費那列要保留");
  assert.ok(record().ledger.some((entry) => entry.giftDate === target.date && entry.amount === -target.amount));

  caseActions.toggleGiftDay(id, target.date);
  assert.equal(caseBalance(record()), before);
  assert.equal(record().ledger.filter((entry) => entry.giftDate === target.date).length, 0);
});
test("不同寶寶不得共用監視器／車號；單寶寶照護不遮蔽另一位", () => {
  reset(); const binding = domainStore.get().bindings[0]; const first = binding.babies[0];
  const firstSubject = domainStore.get().subjects.find((subject) => subject.id === first.babyId)!;
  babycamActions.assign(binding.id, { babyId: first.babyId, name: firstSubject.name, cameraId: first.cameraId, cartNo: first.cartNo, birthDate: firstSubject.birthDate!, sex: "男", birthOrder: 1 });
  const unused = domainStore.get().cameras.find((camera) => !domainStore.get().bindings.some((item) => item.babies.some((baby) => baby.cameraId === camera.id)))!;
  assert.throws(() => babycamActions.assign(binding.id, { name: "示範二寶", cameraId: first.cameraId, cartNo: "DEMO-99", birthDate: "2026-10-01", sex: "女", birthOrder: 2 }), /已由其他寶寶使用/);
  babycamActions.assign(binding.id, { name: "示範二寶", cameraId: unused.id, cartNo: "DEMO-99", birthDate: "2026-10-01", sex: "女", birthOrder: 2 });
  babycamActions.care(binding.id, first.babyId, true);
  const data = domainStore.get(); const changed = data.bindings.find((item) => item.id === binding.id)!;
  assert.equal(viewingBlock(data, changed, changed.babies[0], "internal"), "寶寶照護中");
  assert.equal(viewingBlock(data, changed, changed.babies[1], "internal"), null);
});
test("最外層限制不被每機全天設定放寬；照護中與遮蔽不同燈號", () => {
  reset(); const data = structuredClone(domainStore.get()); const camera = data.cameras[0];
  data.houseWindow = { mode: "scheduled", start: "10:00", end: "12:00" }; camera.scheduleFamily = { mode: "always", start: "00:00", end: "23:59" };
  assert.equal(effectiveViewingWindow(data, camera, "family").window.end, "12:00");
  const baby = data.bindings[0].babies[0]; baby.state = "state-1"; assert.equal(deriveDemoLight(data, camera), "idle"); baby.careMode = true; assert.equal(deriveDemoLight(data, camera), "care");
});
test("跨午夜時段與台北日期期限的端點不互相放寬", () => {
  reset(); const data = structuredClone(domainStore.get()); const binding = data.bindings[0]; const baby = binding.babies[0];
  data.enforceFamily = true; data.houseWindow = { mode: "scheduled", start: "22:00", end: "06:00" }; data.familyWindow = { mode: "always", start: "00:00", end: "23:59" };
  assert.equal(viewingBlock(data, binding, baby, "family", new Date("2026-10-16T22:00:00+08:00")), null);
  assert.equal(viewingBlock(data, binding, baby, "family", new Date("2026-10-17T06:00:00+08:00")), null);
  assert.match(viewingBlock(data, binding, baby, "family", new Date("2026-10-17T06:01:00+08:00"))!, /非開放時段/);
  binding.familyFrom = "2026-10-17";
  assert.match(viewingBlock(data, binding, baby, "family", new Date("2026-10-16T23:00:00+08:00"))!, /未開放親友/);
  binding.validTo = "2026-10-17";
  assert.match(viewingBlock(data, binding, baby, "family", new Date("2026-10-18T00:00:00+08:00"))!, /失效/);
});
test("胎序、修改、解除及重新指派不串到其他寶寶，舊標籤失效", () => {
  reset(); const binding = domainStore.get().bindings[0]; const first = binding.babies[0];
  const subject = domainStore.get().subjects.find((item) => item.id === first.babyId)!;
  const unused = domainStore.get().cameras.find((camera) => !domainStore.get().bindings.some((item) => item.babies.some((baby) => baby.cameraId === camera.id)))!;
  const second = { name: "示範二寶", cameraId: unused.id, cartNo: "DEMO99", birthDate: "2026-10-01", sex: "女" as const, birthOrder: 2 };
  assert.throws(() => babycamActions.assign(binding.id, second), /先將既有寶寶/);
  babycamActions.assign(binding.id, { babyId: first.babyId, name: subject.name, cameraId: first.cameraId, cartNo: first.cartNo, birthDate: subject.birthDate!, sex: "男", birthOrder: 1 });
  assert.equal(domainStore.get().bindings[0].babies[0].identityCode, first.identityCode);
  assert.equal(domainStore.get().subjects.find((item) => item.id === first.babyId)!.birthOrder, 1);
  babycamActions.assign(binding.id, second);
  babycamActions.care(binding.id, first.babyId, true);
  assert.throws(() => babycamActions.scan("錯誤標籤", first.babyId), /識別不符/);
  babycamActions.unassign(binding.id, first.babyId);
  assert.ok(domainStore.get().subjects.some((item) => item.id === first.babyId));
  assert.ok(domainStore.get().careEvents.every((event) => event.babyId !== first.babyId || event.end));
  assert.throws(() => babycamActions.scan(first.identityCode, first.babyId), /識別不符/);
  babycamActions.assign(binding.id, { babyId: first.babyId, name: subject.name, cameraId: first.cameraId, cartNo: first.cartNo, birthDate: subject.birthDate!, sex: "男", birthOrder: 1 });
  assert.notEqual(domainStore.get().bindings[0].babies.find((baby) => baby.babyId === first.babyId)!.identityCode, first.identityCode);
});
test("重發連結失效、親友觀看名額與踢除", () => {
  reset(); const binding = domainStore.get().bindings[0];
  enterViewer("family", binding.phone, binding.passcode, binding.familyTicket, "device-1");
  enterViewer("family", binding.phone, binding.passcode, binding.familyTicket, "device-2");
  assert.throws(() => enterViewer("family", binding.phone, binding.passcode, binding.familyTicket, "device-3"), /人數已滿/);
  babycamActions.kick(binding.id); enterViewer("family", binding.phone, binding.passcode, binding.familyTicket, "device-3");
  babycamActions.reissue(binding.id);
  assert.throws(() => enterViewer("family", binding.phone, binding.passcode, binding.familyTicket, "device-4"), /不正確/);
  assert.equal(domainStore.get().viewingHistory.length, 3);
  assert.ok(domainStore.get().viewingHistory.every((event) => event.end));
  assert.equal(domainStore.get().viewingHistory[2].reason, "重發連結");
});
test("最後管理員與八格固定權限不可被修改", () => {
  reset(); assert.throws(() => babycamActions.staff("demo-admin", "展示管理員", "護理師 陳護理師", true), /最後一位/);
  assert.throws(() => babycamActions.permission("護理師 陳護理師", "08", true), /不可調整/);
  setCurrentRole("護理師 陳護理師"); assert.throws(() => babycamActions.relay("A-Y1", true), /權限/);
});
/*
  ⚠️ 寶寶視訊的分段權限只有 edit／none 兩階（2026-10-20 客戶要求移除唯讀），
  所以不會再出現「看得到但不能改」：canBabycamSection 與 canEditBabycamSection
  對同一個 section 一定給同樣的答案。本測試原本斷言護理長對 03 可看不可改，
  那是舊的三階規格。

  ⚠️ 另記一筆待客戶確認的落差：護理長的 sectionPermissions 種子是 01/02/04/05，
  沒有 03（監視器狀態），所以他連看都看不到。但 CLAUDE.md 記的設計意圖是
  「監視器狀態放在 04 後臺管理，護理長才不用為了看鏡頭健康狀態被塞進系統設定」，
  前提就是護理長看得到。要改請改 domainSeed 的 sectionPermissions，不要改這裡。
*/
test("寶寶視訊的分段權限只有 edit／none 兩階，依角色各自授權", () => {
  reset(); const data = domainStore.get(); const camera = data.cameras[0];
  setCurrentRole("櫃台"); assert.equal(canEditBabycamSection(data, "01"), true);
  setCurrentRole("護理長 婉真");
  assert.equal(canBabycamSection(data, "04"), true); assert.equal(canEditBabycamSection(data, "04"), true);
  assert.equal(canBabycamSection(data, "03"), false); assert.equal(canEditBabycamSection(data, "03"), false);
  assert.throws(() => babycamActions.camera(camera.id, { health: "等待" }), /沒有此視訊功能權限/);
  setCurrentRole("管理者"); assert.equal(canEditBabycamSection(data, "08"), true);
});
test("退房續留的車號與期限同步，接回後終止，重開補登不重做退房", () => {
  reset(); const record = domainStore.get().cases.find((item) => item.stage === 5)!;
  caseActions.advance(record.id); caseActions.inspectAllNormal(record.id); caseActions.completeCheckout(record.id); caseActions.update(record.id, { settlementDone: true, childcare: true, childcareCar: "TC99", childcareContact: "示範家長", childcareDays: 2 });
  caseActions.advance(record.id); const data = domainStore.get(); const binding = data.bindings.find((item) => item.caseId === record.id)!;
  const baby = data.subjects.find((item) => item.caseId === record.id && item.kind === "baby")!;
  assert.equal(baby.room, ""); assert.equal(baby.status, "托嬰"); assert.equal(baby.carNo, "TC99"); assert.equal(binding.babies[0].cartNo, "TC99"); assert.equal(binding.validTo, "2026-10-18");
  caseActions.updateChildcare(record.id, "TC98", 3, 2500, "示範家長", "展示延長"); assert.equal(domainStore.get().bindings.find((item) => item.id === binding.id)!.validTo, "2026-10-19");
  caseActions.endChildcare(record.id); assert.equal(domainStore.get().bindings.find((item) => item.id === binding.id)!.ended, true);
  const dischargedAt = domainStore.get().cases.find((item) => item.id === record.id)!.dischargedAt;
  caseActions.reopen(record.id, "補登備註"); caseActions.advance(record.id);
  assert.equal(domainStore.get().cases.find((item) => item.id === record.id)!.dischargedAt, dischargedAt);
  assert.equal(domainStore.get().bindings.find((item) => item.id === binding.id)!.ended, true);
});
test("離車與掃碼復原只影響原鏡頭；RGB 依原佈線且跳過未知通道", () => {
  reset(); const binding = domainStore.get().bindings[0]; const baby = binding.babies[0];
  babycamActions.scenario(baby.cameraId, { type: "cart-away", now: Date.parse(domainStore.get().demoAt) });
  babycamActions.scenario(baby.cameraId, { type: "tick", now: Date.parse(domainStore.get().demoAt) + 5000 });
  assert.throws(() => babycamActions.scan(baby.identityCode, baby.babyId), /仍顯示離車/);
  babycamActions.scenario(baby.cameraId, { type: "cart-back" }); babycamActions.scan(baby.identityCode, baby.babyId);
  assert.equal(domainStore.get().demoScenarios[baby.cameraId].phase, "restored");
  assert.equal(domainStore.get().bindings[0].babies[0].careMode, false);
  assert.deepEqual(lightChannels("A07", "洋紅").map((item) => [item.channel, item.enabled]), [["A-Y1", true], ["A-Y2", false], ["A-Y3", true]]);
  assert.deepEqual(lightChannels("A16", "白"), []);
});
test("待辦跨角色檢視不等於處理權限，合約設定僅管理員", () => {
  reset(); assert.deepEqual(roleTaskCategories("護理師 陳護理師"), ["醫師巡診", "回補期限", "托嬰"]);
  setCurrentRole("櫃台"); assert.throws(() => taskActions.complete("demo-round"), /僅可檢視/); assert.throws(() => contractSettingActions.reviewDays(7), /僅管理員/);
  setCurrentRole("管理者"); taskActions.complete("demo-round"); assert.ok(domainStore.get().handledTasks.includes("demo-round"));
});
test("作廢觀看不釋出寶寶與監視器，重新交付須換新連結", () => {
  reset(); const binding = domainStore.get().bindings[0];
  babycamActions.revoke(binding.id); const data = domainStore.get();
  assert.equal(data.bindings[0].ended, false); assert.equal(data.bindings[0].babies.length, binding.babies.length);
  assert.equal(deriveDemoLight(data, data.cameras[0]), "idle");
  assert.throws(() => enterViewer("family", binding.phone, binding.passcode, binding.familyTicket, "revoked"), /已結束/);
  babycamActions.reissue(binding.id); assert.notEqual(domainStore.get().bindings[0].familyTicket, binding.familyTicket);
});
test("在鏡頭下時間扣除照護聯集並裁切所選日期", () => {
  reset(); const data = structuredClone(domainStore.get()); const interval = data.cameraIntervals[0];
  interval.start = "2026-10-16T00:00:00+08:00"; data.cameraIntervals = [interval]; data.demoAt = "2026-10-16T12:00:00+08:00";
  data.careEvents = [
    { id: "a", bindingId: interval.bindingId, babyId: interval.babyId, start: "2026-10-16T01:00:00+08:00", end: "2026-10-16T03:00:00+08:00", actor: "測試" },
    { id: "b", bindingId: interval.bindingId, babyId: interval.babyId, start: "2026-10-16T02:00:00+08:00", end: "2026-10-16T04:00:00+08:00", actor: "測試" },
  ];
  const rows = cameraTimeRows(data, "2026-10-16", "2026-10-16"); assert.equal(rows[0][5], 9 * 3600); assert.equal(rows[0][6], 3 * 3600);
  assert.deepEqual(cameraTimeRows(data, "2026-10-17", "2026-10-17"), []);
});
test("瀏覽器 XLSX 是真正 ZIP，包含可跳脫的中文數字資料", () => {
  const bytes = toBrowserXlsx(["媽媽", "金額"], [["示範<&", 1234], ["=不執行公式", 0]]);
  assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x04034b50);
  const text = new TextDecoder().decode(bytes); assert.match(text, /示範&lt;&amp;/); assert.match(text, /<v>1234<\/v>/); assert.match(text, /t="inlineStr"/);
});
test("CSV 保留中文與換行，阻擋公式和控制字元開頭", () => {
  const csv = toCsv(["內容"], [["=1+1"], ["\t公式"], ['中文,"引號"\n換行']]);
  assert.equal(csv.charCodeAt(0), 0xfeff); assert.match(csv, /'=1\+1/); assert.match(csv, /'\t公式/); assert.match(csv, /"中文,""引號""\n換行"/);
});

test("寶寶標籤依性別取之子／之女，雙胞胎才加 A、B", () => {
  assert.equal(babyDisplayName("王○晴", "男"), "王○晴之子");
  assert.equal(babyDisplayName("王○晴", "女"), "王○晴之女");
  assert.equal(babyDisplayName("王○晴", "male", 0), "王○晴之子");
  assert.equal(babyDisplayName("王○晴", "男", 1), "王○晴之子A");
  assert.equal(babyDisplayName("王○晴", "female", 2), "王○晴之女B");
  // 性別未填時一律之子，與手圈標籤同一套規則。
  assert.equal(babyDisplayName("王○晴", null), "王○晴之子");
});

test("合約階段缺項逐條列出，填一項就少一條", () => {
  reset();
  const id = "case-demo-contract";
  const record = () => domainStore.get().cases.find((item) => item.id === id)!;
  assert.deepEqual(caseTransitionErrors(record(), 5), ["請填寫簽約日。", "請填寫攜回審閱日。", "請勾選母乳哺育意願書已確認。", "請完成本案簽名。"]);
  caseActions.update(id, { signedDate: "2026-10-29", reviewStart: "2026-10-24" });
  assert.deepEqual(caseTransitionErrors(record(), 5), ["請勾選母乳哺育意願書已確認。", "請完成本案簽名。"]);
  caseActions.update(id, { milkConsent: true });
  assert.deepEqual(caseTransitionErrors(record(), 5), ["請完成本案簽名。"]);
  caseActions.sign(id, "data:image/png;base64,demo");
  assert.deepEqual(caseTransitionErrors(record(), 5), []);
});

test("消毒排程依星期、日期與房號生效，跨午夜不判錯", () => {
  reset();
  const data = structuredClone(domainStore.get());
  const at = (iso: string) => new Date(iso);
  // 展示資料第二筆：2026-10-16（週五）11:30–13:00、只套 305。
  assert.equal(activeDisinfection(data, "305", at("2026-10-16T12:00:00+08:00"))?.label, "隔離房環境消毒");
  assert.equal(activeDisinfection(data, "306", at("2026-10-16T12:00:00+08:00")), null, "沒排到的房間不該被關");
  assert.equal(activeDisinfection(data, "305", at("2026-10-16T13:30:00+08:00")), null, "過了結束時間就恢復");
  // 第一筆：每週二 09:00–12:00 全院；2026-10-20 是週二。
  assert.equal(activeDisinfection(data, "", at("2026-10-20T10:00:00+08:00"))?.kind, "紫外線");
  assert.equal(activeDisinfection(data, "任意房", at("2026-10-20T10:00:00+08:00"))?.kind, "紫外線", "全院排程不挑房號");
  assert.equal(activeDisinfection(data, "", at("2026-10-21T10:00:00+08:00")), null, "只有週二");
  // 跨午夜與停用
  data.disinfections = [{ id: "x", label: "夜間消毒", kind: "環境", weekday: null, date: "2026-10-16", start: "22:00", end: "02:00", rooms: [], enabled: true }];
  assert.ok(activeDisinfection(data, "", at("2026-10-16T23:30:00+08:00")), "跨午夜的前半段要算在內");
  assert.equal(activeDisinfection(data, "", at("2026-10-16T12:00:00+08:00")), null);
  data.disinfections[0].enabled = false;
  assert.equal(activeDisinfection(data, "", at("2026-10-16T23:30:00+08:00")), null, "停用就不生效");
});

test("消毒期間觀看一律擋下，與授權與時段無關", () => {
  reset();
  const data = structuredClone(domainStore.get());
  const binding = data.bindings.find((item) => !item.ended && item.babies.length)!;
  const baby = binding.babies[0];
  const at = new Date("2026-10-20T10:00:00+08:00"); // 週二紫外線消毒時段
  data.demoAt = at.toISOString();
  assert.match(String(viewingBlock(data, binding, baby, "internal", at)), /紫外線消毒中/);
  assert.match(String(viewingBlock(data, binding, baby, "family", at)), /紫外線消毒中/);
  // 排程停用後就恢復原本的判定（不再是消毒擋的）。
  data.disinfections = [];
  assert.doesNotMatch(String(viewingBlock(data, binding, baby, "internal", at) ?? ""), /消毒/);
});

test("消毒排程的新增驗證：日期、時間格式與房號必須在主檔內", () => {
  reset(); setCurrentRole("管理者");
  const base = { label: "測試消毒", kind: "環境" as const, weekday: null, date: "", start: "09:00", end: "12:00", rooms: [], enabled: true };
  assert.throws(() => babycamActions.saveDisinfection({ ...base, label: " " }), /名稱/);
  assert.throws(() => babycamActions.saveDisinfection({ ...base, date: "" }), /日期/);
  assert.throws(() => babycamActions.saveDisinfection({ ...base, date: "2026-10-20", start: "9:00" }), /HH:MM/);
  assert.throws(() => babycamActions.saveDisinfection({ ...base, date: "2026-10-20", end: "09:00" }), /不可相同/);
  assert.throws(() => babycamActions.saveDisinfection({ ...base, date: "2026-10-20", rooms: ["999"] }), /房間主檔/);
  babycamActions.saveDisinfection({ ...base, date: "2026-10-20", rooms: ["305"] });
  const added = domainStore.get().disinfections.find((item) => item.label === "測試消毒")!;
  assert.deepEqual(added.rooms, ["305"]);
  babycamActions.removeDisinfection(added.id);
  assert.equal(domainStore.get().disinfections.some((item) => item.id === added.id), false);
});
