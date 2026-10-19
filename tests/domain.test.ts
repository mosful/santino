import assert from "node:assert/strict";
import { test } from "node:test";
import { domainStore, caseActions } from "../src/lib/demo/domainStore";
import { setCurrentRole } from "../src/lib/roleStore";
import { caseBalance, dailyCharges } from "../src/lib/domain/rules";
import { babycamActions, canBabycamSection, canEditBabycamSection } from "../src/lib/babycam/actions";
import { deriveDemoLight, effectiveViewingWindow, viewingBlock } from "../src/lib/babycam/viewing";
import { enterViewer } from "../src/lib/babycam/viewerSession";
import { toBrowserXlsx } from "../src/lib/babycam/exports";
import { roleTaskCategories, taskActions } from "../src/lib/domain/tasks";
import { lightChannels } from "../src/lib/babycam/lights";
import { contractSettingActions } from "../src/lib/domain/contractSettings";
import { cameraTimeRows } from "../src/lib/babycam/cameraTime";
import { toCsv } from "../src/lib/babycam/csv";

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
  caseActions.update(id, { checkoutChecklist: ["房卡歸還"], checkoutNote: "其餘項目持續確認" });
  caseActions.completeCheckout(id);
  const current = domainStore.get().cases.find((item) => item.id === id)!;
  assert.ok(current.checkoutCompletedAt);
  assert.ok(current.log.some((entry) => entry.text.includes("返家檢查表完成")));
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
test("寶寶視訊依櫃台、護理長與管理員區分操作權限", () => {
  reset(); const data = domainStore.get(); const camera = data.cameras[0];
  setCurrentRole("櫃台"); assert.equal(canEditBabycamSection(data, "01"), true);
  setCurrentRole("護理長 婉真"); assert.equal(canBabycamSection(data, "03"), true); assert.equal(canEditBabycamSection(data, "03"), false);
  assert.throws(() => babycamActions.camera(camera.id, { health: "等待" }), /僅可檢視/);
  setCurrentRole("管理者"); assert.equal(canEditBabycamSection(data, "08"), true);
});
test("退房續留的車號與期限同步，接回後終止，重開補登不重做退房", () => {
  reset(); const record = domainStore.get().cases.find((item) => item.stage === 5)!;
  caseActions.advance(record.id); caseActions.update(record.id, { settlementDone: true, checkoutChecklist: ["房卡歸還", "遙控器／鑰匙", "客房備品點交", "設施無損壞", "垃圾已清空", "冰箱已清空"], childcare: true, childcareCar: "TC99", childcareContact: "示範家長", childcareDays: 2 });
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
