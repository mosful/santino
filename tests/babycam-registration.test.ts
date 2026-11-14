import { test } from "node:test";
import assert from "node:assert/strict";
import { domainStore } from "../src/lib/demo/domainStore";
import { setCurrentRole } from "../src/lib/roleStore";
import { babycamActions } from "../src/lib/babycam/actions";
import { enterViewer } from "../src/lib/babycam/viewerSession";

const storage = new Map<string, string>();
const events = new EventTarget();
Object.defineProperty(globalThis, "window", { configurable: true, value: {
  localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) },
  dispatchEvent: events.dispatchEvent.bind(events), addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
} });
const reset = () => { setCurrentRole("管理者"); domainStore.reset(); };

test("刪除視訊登記會停止觀看與使用中紀錄，保留案件、合約及照護對象", () => {
  reset();
  const original = domainStore.get().bindings[0];
  const baby = original.babies[0];
  enterViewer("family", original.phone, original.passcode, original.familyTicket, "registration-test");
  babycamActions.care(original.id, baby.babyId, true);
  const before = structuredClone(domainStore.get());
  babycamActions.removeRegistration(original.id);
  const data = domainStore.get();
  const removed = data.bindings.find((binding) => binding.id === original.id)!;
  assert.equal(removed.ended, true);
  assert.equal(removed.viewingRevoked, true);
  assert.ok(removed.deletedAt);
  assert.deepEqual(removed.sessions, []);
  assert.deepEqual(data.cases, before.cases);
  assert.deepEqual(data.subjects, before.subjects);
  assert.deepEqual(data.bindings[1], before.bindings[1]);
  assert.ok(data.viewingHistory.filter((event) => event.bindingId === original.id).every((event) => event.end && event.reason === "刪除視訊入住登記"));
  assert.ok(data.careEvents.filter((event) => event.bindingId === original.id).every((event) => event.end));
  assert.ok(data.cameraIntervals.filter((event) => event.bindingId === original.id).every((event) => event.end));
  assert.throws(() => enterViewer("family", original.phone, original.passcode, original.familyTicket, "old-ticket"), /已結束/);
  assert.throws(() => babycamActions.scan(baby.identityCode, baby.babyId), /標籤已失效/);
  assert.ok(data.audit.some((event) => event.target === original.id && event.action.includes("刪除視訊入住登記")));
});

test("刪除後鏡頭與車號可重新指派，其他有效觀看不受舊登記影響", () => {
  reset();
  const [original, other] = domainStore.get().bindings;
  const released = original.babies[0];
  const baby = other.babies[0];
  const subject = domainStore.get().subjects.find((item) => item.id === baby.babyId)!;
  babycamActions.removeRegistration(original.id);
  assert.equal(enterViewer("family", other.phone, other.passcode, null, "remaining-viewer"), other.id);
  babycamActions.assign(other.id, { babyId: baby.babyId, name: subject.name, cameraId: released.cameraId, cartNo: released.cartNo, birthDate: subject.birthDate || "2026-10-01", sex: "男", birthOrder: baby.birthOrder ?? 0 });
  assert.equal(domainStore.get().bindings.find((item) => item.id === other.id)!.babies[0].cameraId, released.cameraId);
});

test("刪除待指派登記後可重新登記，舊資料不重複啟用", () => {
  reset();
  const id = babycamActions.register("case-demo-contract");
  babycamActions.removeRegistration(id);
  const nextId = babycamActions.register("case-demo-contract");
  assert.notEqual(nextId, id);
  assert.equal(domainStore.get().bindings.filter((item) => item.caseId === "case-demo-contract" && !item.ended).length, 1);
  const before = structuredClone(domainStore.get());
  assert.throws(() => babycamActions.removeRegistration(id), /已結束/);
  assert.deepEqual(domainStore.get(), before);
});

test("刪除權限沿用入住管理角色，護理師不得透過 action 繞過", () => {
  reset();
  const id = domainStore.get().bindings[0].id;
  const before = structuredClone(domainStore.get());
  setCurrentRole("護理師 陳護理師");
  assert.throws(() => babycamActions.removeRegistration(id), /不能刪除/);
  assert.deepEqual(domainStore.get(), before);
  setCurrentRole("櫃台");
  babycamActions.removeRegistration(id);
  assert.equal(domainStore.get().bindings[0].ended, true);
});

test("離開掃碼：掃手圈選狀態後轉照護中，歸位掃碼還原原狀態", () => {
  reset();
  const binding = domainStore.get().bindings.find((item) => !item.ended && item.babies.length)!;
  const baby = binding.babies[0];
  const before = baby.state;
  assert.throws(() => babycamActions.leave("NO-SUCH-CODE", "state-6"), /找不到這個識別碼/);
  assert.throws(() => babycamActions.leave(baby.identityCode, "no-state"), /請選擇/);
  babycamActions.leave(baby.identityCode.toLowerCase(), "state-6");
  let left = domainStore.get().bindings.find((item) => item.id === binding.id)!.babies[0];
  assert.equal(left.state, "state-6");
  assert.equal(left.careMode, true);
  assert.equal(left.stateBeforeLeave, before);
  assert.equal(domainStore.get().careEvents.filter((event) => event.babyId === baby.babyId && !event.end).length, 1);
  // 再掃一次改狀態不重複開照護紀錄，也不覆蓋原本要還原的狀態。
  babycamActions.leave(baby.identityCode, "state-5");
  left = domainStore.get().bindings.find((item) => item.id === binding.id)!.babies[0];
  assert.equal(left.state, "state-5");
  assert.equal(left.stateBeforeLeave, before);
  assert.equal(domainStore.get().careEvents.filter((event) => event.babyId === baby.babyId && !event.end).length, 1);
  babycamActions.scan(baby.identityCode, baby.babyId);
  const back = domainStore.get().bindings.find((item) => item.id === binding.id)!.babies[0];
  assert.equal(back.state, before);
  assert.equal(back.careMode, false);
  assert.equal(back.stateBeforeLeave, undefined);
});

test("狀態維護：新增一律遮蔽排最後，使用中與正常顯示不可刪除", () => {
  reset();
  const count = domainStore.get().displayStates.length;
  babycamActions.displayMaster("", "照光", true, count);
  const added = domainStore.get().displayStates.at(-1)!;
  assert.equal(added.name, "照光");
  assert.equal(added.masked, true);
  babycamActions.display(added.key, "照光中");
  assert.equal(domainStore.get().displayStates.at(-1)!.name, "照光中");
  assert.throws(() => babycamActions.removeDisplay("normal"));
  babycamActions.removeDisplay(added.key);
  assert.equal(domainStore.get().displayStates.length, count);
});
