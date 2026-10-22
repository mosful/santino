import { CARE_SUBJECTS } from "../care/seed";
import { MAMA_ROOMS } from "../mock/mamaRoom";
import { ROOM_MASTER } from "../mock/roomMaster";
import { cameraCodec, DEFAULT_NETWORK_PREFIX } from "../babycam/network";
/*
  展示用的手機與密碼。

  客戶驗收時要能在媽媽端／親友端直接按登入，不必回頭查每一筆的帳密，
  因此全部入住案件共用同一組；觀看連結（?ticket=）仍然逐筆不同，
  真正決定看到哪一間房的是 ticket，不是這組帳密。
  正式版請改回每筆各自產生。
*/
export { DEMO_PHONE } from "./demoDefaults";
import { DEMO_PHONE } from "./demoDefaults";
export const DEMO_PASSCODE = "123456";

import { DEFAULT_PRINT_SETTINGS } from "../babycam/wristband-print";
import { HOSPITALS } from "../domain/options";
import { DEFAULT_CHECKOUT_ITEMS } from "../domain/checkout";
import { DEFAULT_SALE_ITEMS } from "../domain/sales";
import type { CaseRecord, DemoDomain, WindowRule } from "../domain/types";
import { casePrice } from "../domain/rules";

export const inheritWindow = (): WindowRule => ({ mode: "inherit", start: "10:00", end: "20:00" });
export function blankCase(id: string): CaseRecord {
  return { id, legacyId: 0, customerId: `customer-${id}`, name: "", phone: "", dueDate: "", idNo: "", stage: 0, closed: false, forced: false, owner: "櫃台", room: "", roomType: "精緻", days: 24, contractNo: "", deposit: 0, tasting: false, visitDate: "", visitStatus: "未出席", source: "網路推薦", hospital: HOSPITALS[0], priceClass: "一般", corporateCompany: "", note: "", category: "懷孕", parity: "第 1 胎", deliveryMethod: "未定", visitTime: "14:00", receptionist: "林小姐", visitIntent: "考慮中", visitNote: "", orderDate: "", paymentMethod: "轉帳", orderNote: "", quotedAmount: 180000, overrideAmount: null, overrideReason: "", signed: false, contractVersion: 0, reviewStart: "", signedDate: "", actualAdmission: "", dischargedAt: "", settlementDone: false, prenatalContactDone: false, hospitalizationNoticeDone: false, dischargeNoticeDone: false, preAdmissionPapersDone: false, admissionGuidanceDone: false, admissionPaymentNoticeDone: false, checkoutNote: "", childcare: false, childcareEnded: false, childcareCar: "", childcareDays: 2, childcareFee: 2500, childcareContact: "", completed: [], ledger: [], payments: [], log: [], milkChoice: "母乳" };
}
const occupied = MAMA_ROOMS.filter((room) => room.motherName);
const cases: CaseRecord[] = occupied.map((room, index) => {
  const record = { ...blankCase(`stay-${room.chartNo}`), name: room.motherName!, phone: DEMO_PHONE, stage: 5 as const, room: room.room, days: 24, contractNo: `展示收字${String(index + 1).padStart(4, "0")}`, deposit: 30000, signed: true, contractVersion: 2, actualAdmission: "2026-10-01", reviewStart: "2026-09-20", signedDate: "2026-09-25", completed: [0, 1, 2, 3, 4] };
  record.legacyId = index + 1; record.quotedAmount = casePrice(record); record.contractSnapshot = JSON.stringify({ name: record.name, phone: record.phone, contractNo: record.contractNo, roomType: record.roomType, days: record.days, amount: record.quotedAmount, signedDate: record.signedDate }); return record;
});
const next = blankCase("case-demo-appointment"); Object.assign(next, { legacyId: cases.length + 1, name: "陳○安", phone: DEMO_PHONE, dueDate: "2027-01-18", visitDate: "2026-10-20", visitTime: "14:00", receptionist: "林小姐" }); cases.unshift(next);
[
  { id: "case-demo-visit", name: "林○晴", phone: DEMO_PHONE, stage: 1 as const, dueDate: "2027-02-06", visitDate: "2026-10-19", visitTime: "15:00", receptionist: "陳小姐", completed: [0] },
  { id: "case-demo-deposit", name: "黃○如", phone: DEMO_PHONE, stage: 2 as const, dueDate: "2027-01-28", visitDate: "2026-10-18", visitStatus: "已出席", completed: [0, 1] },
  { id: "case-demo-contract", name: "許○心", phone: DEMO_PHONE, stage: 3 as const, dueDate: "2027-01-08", visitDate: "2026-10-17", visitStatus: "已出席", contractNo: "展示收字P004", deposit: 30000, completed: [0, 1, 2] },
  { id: "case-demo-preadmission", name: "吳○萱", phone: DEMO_PHONE, stage: 4 as const, dueDate: "2026-10-25", visitDate: "2026-09-20", visitStatus: "已出席", contractNo: "展示收字P005", deposit: 30000, signed: true, signature: "data:image/png;base64,", contractVersion: 1, reviewStart: "2026-09-21", signedDate: "2026-09-26", milkConsent: true, completed: [0, 1, 2, 3] },
].forEach((item, index) => {
  const record = blankCase(item.id);
  Object.assign(record, item, { legacyId: cases.length + index + 2 });
  record.quotedAmount = casePrice(record);
  cases.unshift(record);
});
for (const [index, baby] of CARE_SUBJECTS.filter((subject) => subject.kind === "baby" && subject.status === "托嬰" && !subject.historical).entries()) {
  const record = blankCase(baby.caseId);
  Object.assign(record, { legacyId: Math.max(...cases.map((item) => item.legacyId)) + 1, name: baby.motherName, phone: DEMO_PHONE, stage: 6, closed: true, signed: true, actualAdmission: "2026-10-01", dischargedAt: "2026-10-15T09:00:00+08:00", room: baby.previousRoom ?? "", childcare: true, childcareCar: baby.carNo ?? `T${index + 1}`, childcareDays: 7, childcareFee: 2500, childcareContact: "示範家長", days: 1, completed: [0, 1, 2, 3, 4, 5, 6] });
  record.quotedAmount = casePrice(record); cases.push(record);
}
const cameraCodes = ["A01", "A02", "A03", "A05", "A06", "A07", "A08", "A09", "A10", "A11", "A12", "A13", "A15", "A16", "A17", "A18", "A19", "A20", "A21", "A22", "A23", "B01", "B02", "B03", "B05", "B06", "B07", "B08", "B09", "B10", "B11", "B12", "B13"];

/*
  顯示狀態與內建背景圖。

  十種狀態與背景圖皆取自 BabyCam（`public/state-backgrounds/state-0..9-*.png`，
  本專案轉為 webp 以縮小靜態輸出：4.6MB → 589KB，畫面內容不變）。
  除「正常顯示」外一律遮蔽畫面；遮蔽時顯示的就是這張底圖。

  ⚠️ masked 不開放在畫面上調整——那是遮蔽機制的根本，把「護理」改成不遮蔽
  就等於讓家屬看到不該看的畫面。新增的自訂狀態一律遮蔽。
*/
const STATE_BACKGROUNDS: [name: string, file: string][] = [
  ["正常顯示", "state-0-normal"],
  ["親子同室", "state-1-rooming-in"],
  ["護理", "state-2-nursing"],
  ["消毒", "state-3-disinfection"],
  ["隔離", "state-4-isolation"],
  ["餵奶", "state-5-feeding"],
  ["游泳", "state-6-swimming"],
  ["環境紫消", "state-7-uv"],
  ["撫觸", "state-8-touch"],
  ["非探視", "state-9-no-visiting"],
];

export const DISPLAY_STATE_SEED: DemoDomain["displayStates"] = STATE_BACKGROUNDS.map(([name, file], index) => ({
  key: index === 0 ? "normal" : `state-${index}`,
  name,
  masked: index > 0,
  defaultImage: `/state-backgrounds/${file}.webp`,
}));

export const DOMAIN_SEED: DemoDomain = {
  version: 4, subjects: structuredClone(CARE_SUBJECTS), cases, checkoutItems: structuredClone(DEFAULT_CHECKOUT_ITEMS), saleItems: structuredClone(DEFAULT_SALE_ITEMS),
  cameras: cameraCodes.map((code, index) => ({ id: `camera-${index + 1}`, code, zone: code[0] as "A" | "B", enabled: true, codec: cameraCodec(code) ?? "H.264", health: index === 12 ? "異常" : "正常", lastShotAt: "2026-10-16T12:00:00+08:00", scheduleInternal: inheritWindow(), scheduleFamily: inheritWindow(), baseline: false })),
  bindings: cases.filter((record) => record.stage === 5 || record.childcare && !record.childcareEnded).map((record, index) => ({
    id: `binding-${record.id}`, caseId: record.id, room: record.room, motherName: record.name, phone: record.phone,
    validFrom: "2026-10-01", validTo: record.childcare ? "2026-10-22" : "2026-11-01", familyEnabled: true, familyFrom: "", familyTo: "", internalWindow: inheritWindow(), familyWindow: inheritWindow(), internalTicket: `demo-internal-${index + 1}`, familyTicket: `demo-family-${index + 1}`, passcode: DEMO_PASSCODE,
    babies: CARE_SUBJECTS.filter((subject) => subject.caseId === record.id && subject.kind === "baby" && (index < 28 || record.childcare)).map((baby) => ({ babyId: baby.id, cameraId: `camera-${record.childcare ? index - 3 : index + 1}`, cartNo: record.childcare ? baby.carNo! : `C${String(index + 1).padStart(2, "0")}`, identityCode: `DEMO-${String(index + 1).padStart(4, "0")}-BABY`, state: "normal", careMode: false })), sessions: [], ended: false,
  })),
  networkPrefix: DEFAULT_NETWORK_PREFIX,
  displayStates: DISPLAY_STATE_SEED,
  houseWindow: { mode: "always", start: "00:00", end: "23:59" }, internalWindow: { mode: "scheduled", start: "10:00", end: "22:00" }, familyWindow: { mode: "scheduled", start: "10:00", end: "20:00" }, enforceInternal: false, enforceFamily: false, familyLimit: 2, concurrencyEnforced: true,
  demoAt: "2026-10-16T12:00:00+08:00", viewScenario: "normal", lightColors: { empty: "熄滅", care: "熄滅", idle: "白", internal: "紅", family: "洋紅" }, relayChannels: {}, audit: [], careEvents: [],
  staff: [{ id: "demo-admin", name: "展示管理員", role: "管理者", enabled: true }, { id: "demo-nurse", name: "展示護理師", role: "護理師 陳護理師", enabled: true }],
  /*
    寶寶視訊的分段權限（代號與 BabyCam 的 01–08 相同）。

    ⚠️ 只列出該角色**實際操作**的格子，不要「多給一格反正看得到也沒差」：
    多一格就會讓整個功能群組（後臺管理／系統設定）出現在選單上，
    客戶看到的是「櫃台怎麼進得去後臺」。08 系統格固定只給管理者，不在這裡列。
    - 櫃台：01 入住登記與交付、紀錄與報表。
    - 護理師：01 入住狀態（要挑媽媽才能指派）＋02 寶寶登錄與掃碼歸位。
    - 衛教師：不涉及寶寶視訊。
    - 護理長：以上全部＋04 時段與房間、05 狀態背景。
  */
  sectionPermissions: { 櫃台: ["01"], "護理師 陳護理師": ["01", "02"], "衛教師 琳雅": [], "護理長 婉真": ["01", "02", "04", "05"] },
  printSettings: DEFAULT_PRINT_SETTINGS,
  // 房號主檔與院務端共用同一份（mock/roomMaster.ts，複製自 BabyCam 的現場快照）。
  rooms: ROOM_MASTER.map((room) => ({ room: room.room, roomType: room.roomType === "精緻房" ? "精緻" : room.roomType === "VIP房" ? "VIP" : "VILLA", enabled: true })),
  viewingHistory: [],
  tasks: [
    { id: "demo-round", date: "2026-10-17", category: "醫師巡診", title: "匿名個案巡診追蹤", caseId: cases.find((record) => record.stage === 5)?.id },
    { id: "demo-course", date: "2026-10-18", category: "課程", title: "返家照護示範課程" },
    { id: "demo-reminder", date: "2026-10-17", category: "關懷／提醒", title: "媽媽哺乳追蹤提醒", caseId: cases.find((record) => record.stage === 5)?.id },
  ], handledTasks: [],
  contractSettings: { reviewDays: 5, templates: [{ id: 1, name: "標準合約示範範本", version: "v1", active: true, createdDate: "2026-10-16", clauses: "本範本僅供靜態流程展示，正式條文另依院方確認版本。" }] },
  demoScenarios: {}, detection: { enabled: false, threshold: 0.3, streak: 3, intervalSeconds: 5, maxAgeSeconds: 120 },
  roomTypes: ["精緻", "VIP", "VILLA"].map((name) => ({ id: name, name, priceCategory: name as "精緻" | "VIP" | "VILLA" })),
  lightLabels: { empty: "無寶寶", care: "寶寶照護中", idle: "有寶寶無人看", internal: "院內觀看", family: "親友觀看" },
  cameraIntervals: [],
};

// 初始房卡也使用已指派的車號，避免照護頁與標籤各讀一份資料。
for (const binding of DOMAIN_SEED.bindings) for (const baby of binding.babies) {
  const subject = DOMAIN_SEED.subjects.find((item) => item.id === baby.babyId);
  if (subject) { subject.carNo = baby.cartNo; subject.birthOrder = baby.birthOrder ?? 0; }
  DOMAIN_SEED.cameraIntervals.push({ id: `seed-${baby.babyId}`, bindingId: binding.id, babyId: baby.babyId, cameraId: baby.cameraId, start: `${binding.validFrom}T00:00:00+08:00`, end: null });
}
