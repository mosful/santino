import { CARE_SUBJECTS } from "../care/seed";
import { MAMA_ROOMS } from "../mock/mamaRoom";
import { OPS_ROOMS } from "../mock/opsRoom";
import { DEFAULT_PRINT_SETTINGS } from "../babycam/wristband-print";
import type { CaseRecord, DemoDomain, WindowRule } from "../domain/types";
import { casePrice } from "../domain/rules";

export const inheritWindow = (): WindowRule => ({ mode: "inherit", start: "10:00", end: "20:00" });
export function blankCase(id: string): CaseRecord {
  return { id, legacyId: 0, customerId: `customer-${id}`, name: "", phone: "", dueDate: "", idNo: "", stage: 0, closed: false, forced: false, owner: "櫃台", room: "", roomType: "精緻", days: 24, contractNo: "", deposit: 0, tasting: false, visitDate: "", visitStatus: "未出席", source: "網路推薦", hospital: "景星（園內）", priceClass: "一般", corporateCompany: "", note: "", category: "懷孕", parity: "第 1 胎", deliveryMethod: "未定", visitTime: "14:00", receptionist: "林小姐", visitIntent: "考慮中", visitNote: "", orderDate: "", paymentMethod: "轉帳", orderNote: "", quotedAmount: 180000, overrideAmount: null, overrideReason: "", signed: false, contractVersion: 0, reviewStart: "", signedDate: "", actualAdmission: "", dischargedAt: "", checkoutChecklist: [], settlementDone: false, prenatalContactDone: false, hospitalizationNoticeDone: false, dischargeNoticeDone: false, preAdmissionPapersDone: false, admissionGuidanceDone: false, admissionPaymentNoticeDone: false, checkoutNote: "", childcare: false, childcareEnded: false, childcareCar: "", childcareDays: 2, childcareFee: 2500, childcareContact: "", completed: [], ledger: [], payments: [], log: [], milkChoice: "母乳" };
}
const occupied = MAMA_ROOMS.filter((room) => room.motherName);
const cases: CaseRecord[] = occupied.map((room, index) => {
  const record = { ...blankCase(`stay-${room.chartNo}`), name: room.motherName!, phone: `展示手機-${index + 1}`, stage: 5 as const, room: room.room, days: 24, contractNo: `展示收字${String(index + 1).padStart(4, "0")}`, deposit: 30000, signed: true, contractVersion: 2, actualAdmission: "2026-10-01", reviewStart: "2026-09-20", signedDate: "2026-09-25", completed: [0, 1, 2, 3, 4] };
  record.legacyId = index + 1; record.quotedAmount = casePrice(record); record.contractSnapshot = JSON.stringify({ name: record.name, phone: record.phone, contractNo: record.contractNo, roomType: record.roomType, days: record.days, amount: record.quotedAmount, signedDate: record.signedDate }); return record;
});
const next = blankCase("case-demo-appointment"); Object.assign(next, { legacyId: cases.length + 1, name: "陳○安", phone: "展示手機-預約", dueDate: "2027-01-18", visitDate: "2026-10-20", visitTime: "14:00", receptionist: "林小姐" }); cases.unshift(next);
[
  { id: "case-demo-visit", name: "林○晴", phone: "展示手機-參觀", stage: 1 as const, dueDate: "2027-02-06", visitDate: "2026-10-19", visitTime: "15:00", receptionist: "陳小姐", completed: [0] },
  { id: "case-demo-deposit", name: "黃○如", phone: "展示手機-下訂", stage: 2 as const, dueDate: "2027-01-28", visitDate: "2026-10-18", visitStatus: "已出席", completed: [0, 1] },
  { id: "case-demo-contract", name: "許○心", phone: "展示手機-合約", stage: 3 as const, dueDate: "2027-01-08", visitDate: "2026-10-17", visitStatus: "已出席", contractNo: "展示收字P004", deposit: 30000, completed: [0, 1, 2] },
  { id: "case-demo-preadmission", name: "吳○萱", phone: "展示手機-入住前", stage: 4 as const, dueDate: "2026-10-25", visitDate: "2026-09-20", visitStatus: "已出席", contractNo: "展示收字P005", deposit: 30000, signed: true, signature: "data:image/png;base64,", contractVersion: 1, reviewStart: "2026-09-21", signedDate: "2026-09-26", milkConsent: true, completed: [0, 1, 2, 3] },
].forEach((item, index) => {
  const record = blankCase(item.id);
  Object.assign(record, item, { legacyId: cases.length + index + 2 });
  record.quotedAmount = casePrice(record);
  cases.unshift(record);
});
for (const [index, baby] of CARE_SUBJECTS.filter((subject) => subject.kind === "baby" && subject.status === "托嬰" && !subject.historical).entries()) {
  const record = blankCase(baby.caseId);
  Object.assign(record, { legacyId: Math.max(...cases.map((item) => item.legacyId)) + 1, name: baby.motherName, phone: `展示托嬰手機-${index + 1}`, stage: 6, closed: true, signed: true, actualAdmission: "2026-10-01", dischargedAt: "2026-10-15T09:00:00+08:00", childcare: true, childcareCar: baby.carNo ?? `T${index + 1}`, childcareDays: 7, childcareFee: 2500, childcareContact: "示範家長", days: 1, completed: [0, 1, 2, 3, 4, 5, 6] });
  record.quotedAmount = casePrice(record); cases.push(record);
}
const cameraCodes = ["A01", "A02", "A03", "A05", "A06", "A07", "A08", "A09", "A10", "A11", "A12", "A13", "A15", "A16", "A17", "A18", "A19", "A20", "A21", "A22", "A23", "B01", "B02", "B03", "B05", "B06", "B07", "B08", "B09", "B10", "B11", "B12", "B13"];

export const DOMAIN_SEED: DemoDomain = {
  version: 1, subjects: structuredClone(CARE_SUBJECTS), cases,
  cameras: cameraCodes.map((code, index) => ({ id: `camera-${index + 1}`, code, zone: code[0] as "A" | "B", enabled: true, health: index === 12 ? "異常" : "正常", lastShotAt: "2026-10-16T12:00:00+08:00", scheduleInternal: inheritWindow(), scheduleFamily: inheritWindow(), baseline: false })),
  bindings: cases.filter((record) => record.stage === 5 || record.childcare && !record.childcareEnded).map((record, index) => ({
    id: `binding-${record.id}`, caseId: record.id, room: record.room, motherName: record.name, phone: record.phone,
    validFrom: "2026-10-01", validTo: record.childcare ? "2026-10-22" : "2026-11-01", familyEnabled: true, familyFrom: "", familyTo: "", internalWindow: inheritWindow(), familyWindow: inheritWindow(), internalTicket: `demo-internal-${index + 1}`, familyTicket: `demo-family-${index + 1}`, passcode: `DEMO${String(index + 1).padStart(4, "0")}`,
    babies: CARE_SUBJECTS.filter((subject) => subject.caseId === record.id && subject.kind === "baby" && (index < 28 || record.childcare)).map((baby) => ({ babyId: baby.id, cameraId: `camera-${record.childcare ? index - 3 : index + 1}`, cartNo: record.childcare ? baby.carNo! : `C${String(index + 1).padStart(2, "0")}`, identityCode: `DEMO-${String(index + 1).padStart(4, "0")}-BABY`, state: "normal", careMode: false })), sessions: [], ended: false,
  })),
  displayStates: [{ key: "normal", name: "正常顯示", masked: false }, ...["親子同室", "護理", "消毒", "隔離", "餵奶", "游泳", "環境紫消", "撫觸", "非探視"].map((name, index) => ({ key: `state-${index + 1}`, name, masked: true }))],
  houseWindow: { mode: "always", start: "00:00", end: "23:59" }, internalWindow: { mode: "scheduled", start: "10:00", end: "22:00" }, familyWindow: { mode: "scheduled", start: "10:00", end: "20:00" }, enforceInternal: false, enforceFamily: false, familyLimit: 2, concurrencyEnforced: true,
  demoAt: "2026-10-16T12:00:00+08:00", viewScenario: "normal", lightColors: { empty: "熄滅", care: "熄滅", idle: "白", internal: "紅", family: "洋紅" }, relayChannels: {}, audit: [], careEvents: [],
  staff: [{ id: "demo-admin", name: "展示管理員", role: "系統管理員", enabled: true }, { id: "demo-nurse", name: "展示護理師", role: "護理師", enabled: true }],
  sectionPermissions: { 櫃台: ["01", "02", "03"], 護理師: ["01", "02", "03"], "衛教師 琳雅": [], "阿長 婉真": ["01", "02", "03", "04", "05"] },
  printSettings: DEFAULT_PRINT_SETTINGS,
  rooms: OPS_ROOMS.map((room) => ({ room: room.room, roomType: room.roomType === "精緻房" ? "精緻" : room.roomType === "VIP房" ? "VIP" : "VILLA", enabled: true })),
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
