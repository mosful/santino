"use client";

import { createPersistentStore } from "./persistentStore";
import { DOMAIN_SEED, blankCase, inheritWindow } from "./domainSeed";
import { CASE_STAGES, type CaseRecord, type DemoDomain, type ReservationInput } from "../domain/types";
import { casePrice, caseTransitionErrors } from "../domain/rules";
import { getCurrentRole } from "../roleStore";
import { ROLE_PROFILE } from "../permissions";
import { closeViewingHistory } from "../babycam/history";
import { normalizeCartNo } from "../babycam/cart-no";

function valid(value: unknown): value is DemoDomain {
  const data = value as DemoDomain | null;
  if (!data || data.version !== 2 || !Array.isArray(data.cases) || !Array.isArray(data.subjects) || !Array.isArray(data.cameras) || !Array.isArray(data.bindings) || !Array.isArray(data.audit)) return false;
  if (!data.cameras.length || !Array.isArray(data.displayStates) || !data.houseWindow || !data.internalWindow || !data.familyWindow || !data.bindings.every((binding) => Array.isArray(binding.babies) && Array.isArray(binding.sessions))) return false;
  data.careEvents ??= []; data.staff ??= structuredClone(DOMAIN_SEED.staff); data.sectionPermissions ??= structuredClone(DOMAIN_SEED.sectionPermissions);
  data.rooms ??= structuredClone(DOMAIN_SEED.rooms); data.printSettings ??= structuredClone(DOMAIN_SEED.printSettings); data.viewingHistory ??= [];
  data.tasks ??= structuredClone(DOMAIN_SEED.tasks); data.handledTasks ??= [];
  data.contractSettings ??= structuredClone(DOMAIN_SEED.contractSettings);
  data.demoScenarios ??= {}; data.detection ??= structuredClone(DOMAIN_SEED.detection);
  data.roomTypes ??= structuredClone(DOMAIN_SEED.roomTypes); data.lightLabels ??= structuredClone(DOMAIN_SEED.lightLabels);
  data.cameraIntervals ??= data.bindings.filter((binding) => !binding.ended).flatMap((binding) => binding.babies.map((baby) => ({ id: `migrated-${baby.babyId}`, bindingId: binding.id, babyId: baby.babyId, cameraId: baby.cameraId, start: `${binding.validFrom}T00:00:00+08:00`, end: null })));
  for (const subject of data.subjects.filter((item) => !item.historical)) {
    const binding = data.bindings.find((item) => !item.ended && item.babies.some((baby) => baby.babyId === subject.id));
    if (binding) { const baby = binding.babies.find((item) => item.babyId === subject.id); if (!subject.carNo) subject.carNo = baby?.cartNo; subject.birthOrder ??= baby?.birthOrder ?? 0; }
    if (subject.status === "托嬰" && !data.cases.some((record) => record.id === subject.caseId)) {
      const seed = DOMAIN_SEED.cases.find((record) => record.id === subject.caseId);
      if (seed) { const record = structuredClone(seed); record.legacyId = Math.max(0, ...data.cases.map((item) => item.legacyId || 0)) + 1; data.cases.push(record); }
    }
  }
  for (const record of data.cases.filter((item) => !item.dischargedAt || item.childcare && !item.childcareEnded)) {
    if (!data.bindings.some((binding) => binding.caseId === record.id)) {
      const seed = DOMAIN_SEED.bindings.find((binding) => binding.caseId === record.id);
      if (seed) data.bindings.push({ ...structuredClone(seed), babies: [] });
    }
  }
  let nextId = Math.max(0, ...data.cases.map((record) => record.legacyId || 0));
  data.cases.forEach((record) => {
    if (!record.legacyId) record.legacyId = ++nextId;
    record.category ??= "懷孕"; record.parity ??= "第 1 胎"; record.deliveryMethod ??= "未定";
    record.visitTime ??= "14:00"; record.receptionist ??= "林小姐";
    record.corporateCompany ??= "";
    record.visitIntent ??= "考慮中"; record.visitNote ??= ""; record.orderDate ??= ""; record.paymentMethod ??= "轉帳"; record.orderNote ??= "";
    record.prenatalContactDone ??= false; record.hospitalizationNoticeDone ??= false; record.dischargeNoticeDone ??= false;
    record.preAdmissionPapersDone ??= false; record.admissionGuidanceDone ??= false; record.admissionPaymentNoticeDone ??= false;
    record.checkoutNote ??= ""; record.payments ??= [];
  });
  return true;
}
export const domainStore = createPersistentStore("santino_domain_v1", DOMAIN_SEED, valid);
export const useDomainStore = domainStore.useStore;
export const currentActor = () => `${ROLE_PROFILE[getCurrentRole()].name}（${getCurrentRole()}）`;
export function audit(data: DemoDomain, action: string, target: string) {
  data.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), actor: currentActor(), action, target });
}
function canManageCases() { return ["櫃台", "護理長 婉真", "管理者"].includes(getCurrentRole()); }
function caseLog(record: CaseRecord, text: string) { record.log.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), actor: currentActor(), text }); }
function findCase(data: DemoDomain, id: string, allowClosed = false) {
  if (!canManageCases()) throw new Error("目前角色不能修改案件。");
  const record = data.cases.find((item) => item.id === id);
  if (!record) throw new Error("找不到案件。");
  if (record.closed && !allowClosed) throw new Error("此案件已結案，請先由主管重新開啟。");
  return record;
}
function synchronizeIdentity(data: DemoDomain, record: CaseRecord) {
  data.subjects.filter((subject) => subject.caseId === record.id).forEach((subject) => { subject.motherName = record.name; if (subject.kind === "mama") subject.name = record.name; });
  data.bindings.filter((binding) => binding.caseId === record.id).forEach((binding) => { binding.motherName = record.name; binding.phone = record.phone; });
}
function reserveViewing(data: DemoDomain, record: CaseRecord) {
  if (data.bindings.some((binding) => binding.caseId === record.id && !binding.ended)) return;
  data.bindings.push({ id: `binding-${record.id}`, caseId: record.id, room: record.room, motherName: record.name, phone: record.phone, validFrom: record.actualAdmission, validTo: new Date(Date.parse(`${record.actualAdmission}T00:00:00+08:00`) + (record.days + 1) * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }), familyEnabled: true, familyFrom: "", familyTo: "", internalWindow: inheritWindow(), familyWindow: inheritWindow(), internalTicket: crypto.randomUUID(), familyTicket: crypto.randomUUID(), passcode: `DEMO${String(data.bindings.length + 1).padStart(4, "0")}`, babies: [], sessions: [], ended: false });
}
export const caseActions = {
  create(name: string, phone: string) {
    if (!canManageCases()) throw new Error("目前角色不能建立案件。");
    if (!name.trim() || !phone.trim()) throw new Error("請填寫媽媽姓名與聯絡電話。");
    const id = `case-${crypto.randomUUID()}`;
    domainStore.update((data) => { const record = blankCase(id); record.legacyId = Math.max(0, ...data.cases.map((item) => item.legacyId)) + 1; record.quotedAmount = casePrice(record); record.name = name.trim(); record.phone = phone.trim(); record.owner = currentActor(); caseLog(record, "建立預約案件"); data.cases.unshift(record); audit(data, "建立案件", id); });
    return id;
  },
  createReservation(input: ReservationInput, asDraft = false) {
    if (!canManageCases()) throw new Error("目前角色不能建立案件。");
    if (!input.name.trim() || !input.phone.trim()) throw new Error("請填寫媽媽姓名與聯絡電話。");
    if (!asDraft && (!input.category || !input.dueDate || !input.parity || !input.deliveryMethod || !input.hospital || !input.visitDate || !input.visitTime || !input.source || !input.receptionist)) throw new Error("請完成預約表單的必填欄位。");
    const id = `case-${crypto.randomUUID()}`;
    domainStore.update((data) => {
      const record = blankCase(id);
      record.legacyId = Math.max(0, ...data.cases.map((item) => item.legacyId)) + 1;
      Object.assign(record, { name: input.name.trim(), phone: input.phone.trim(), dueDate: input.dueDate, category: input.category, parity: input.parity, deliveryMethod: input.deliveryMethod, hospital: input.hospital, visitDate: input.visitDate, visitTime: input.visitTime, source: input.source, receptionist: input.receptionist, note: input.note.trim(), owner: input.receptionist });
      record.quotedAmount = casePrice(record);
      if (asDraft) record.draftAt = new Date().toISOString();
      caseLog(record, asDraft ? "暫存預約案件" : "建立完整預約案件");
      data.cases.unshift(record); audit(data, asDraft ? "暫存預約案件" : "建立案件", id);
    });
    return id;
  },
  update(id: string, patch: Partial<CaseRecord>) {
    domainStore.update((data) => {
      const record = findCase(data, id);
      const allowed = ["name", "phone", "dueDate", "idNo", "owner", "room", "roomType", "days", "contractNo", "deposit", "tasting", "visitDate", "visitStatus", "source", "hospital", "priceClass", "corporateCompany", "note", "category", "parity", "deliveryMethod", "visitTime", "receptionist", "visitIntent", "visitNote", "orderDate", "paymentMethod", "orderNote", "reviewStart", "signedDate", "actualAdmission", "checkoutChecklist", "settlementDone", "checkoutNote", "childcare", "childcareCar", "childcareDays", "childcareFee", "childcareContact", "customerDetails", "addOns", "bossGift", "milkConsent", "milkChoice", "chineseConsent", "proxySigned", "proxyName"];
      if (Object.keys(patch).some((key) => !allowed.includes(key))) throw new Error("此欄位須使用對應的案件操作。");
      if (record.signed && ["roomType", "days", "deposit", "contractNo", "hospital", "priceClass", "corporateCompany", "addOns", "bossGift"].some((key) => key in patch)) throw new Error("已簽合約的條件異動請使用合約變更單。");
      if (patch.days !== undefined && (!Number.isInteger(patch.days) || patch.days < 1 || patch.days > 365)) throw new Error("入住天數請填 1 至 365 的整數。");
      if (patch.deposit !== undefined && (!Number.isFinite(patch.deposit) || patch.deposit < 0)) throw new Error("訂金金額不正確。");
      if (patch.contractNo && data.cases.some((item) => item.id !== id && item.contractNo === patch.contractNo)) throw new Error("收字號已由另一案件使用，請核對原案件。");
      if (record.actualAdmission && record.stage >= 5 && patch.room !== undefined && patch.room !== record.room) throw new Error("入住後換房請使用合約變更單。");
      if (record.signed && patch.signedDate !== undefined && patch.signedDate !== record.signedDate) throw new Error("已簽合約的簽約日不可直接修改。");
      if (record.stage >= 5 && patch.actualAdmission !== undefined && patch.actualAdmission !== record.actualAdmission) throw new Error("已入住日期須由主管透過變更紀錄處理。");
      if (record.signed && ("proxySigned" in patch || "proxyName" in patch)) throw new Error("已簽署的代簽資訊不可修改。");
      if (record.signed && patch.reviewStart && record.reviewStart && patch.reviewStart > record.reviewStart) throw new Error("審閱日起算日只能往前調整。");
      Object.assign(record, patch); if (!record.signed) record.quotedAmount = casePrice(record); record.draftAt = new Date().toISOString(); synchronizeIdentity(data, record);
    });
  },
  override(id: string, amount: number, reason: string) {
    domainStore.update((data) => { const record = findCase(data, id); if (record.signed) throw new Error("已簽合約請使用變更單。"); if (!reason.trim() || !Number.isFinite(amount) || amount < 0) throw new Error("請填寫有效金額與覆寫原因。"); const before = record.overrideAmount ?? record.quotedAmount; record.overrideAmount = amount; record.overrideReason = reason.trim(); caseLog(record, `覆寫金額 ${before} → ${amount}；原因：${reason.trim()}`); audit(data, "報價覆寫", id); });
  },
  save(id: string) { domainStore.update((data) => { const record = findCase(data, id); record.draftAt = new Date().toISOString(); caseLog(record, "暫存整張案件單"); }); },
  timeline(id: string, key: "prenatalContactDone" | "hospitalizationNoticeDone" | "dischargeNoticeDone" | "preAdmissionPapersDone" | "admissionGuidanceDone" | "admissionPaymentNoticeDone", done: boolean) {
    const labels = { prenatalContactDone: "產前關懷電話", hospitalizationNoticeDone: "住院通知", dischargeNoticeDone: "出院通知", preAdmissionPapersDone: "入住前紙本準備", admissionGuidanceDone: "入住指導單", admissionPaymentNoticeDone: "入住繳款通知單" };
    domainStore.update((data) => { const record = findCase(data, id); record[key] = done; caseLog(record, `${labels[key]}：${done ? "已完成" : "改回待辦"}`); audit(data, "更新入住前時間軸", `${id}:${key}`); });
  },
  payment(id: string, amount: number, method: string, date: string, note: string) {
    if (!Number.isFinite(amount) || amount <= 0 || !method || !date) throw new Error("請填寫付款金額、方式與日期。");
    domainStore.update((data) => { const record = findCase(data, id); const at = new Date().toISOString(); record.payments.unshift({ id: crypto.randomUUID(), amount, method, date, note: note.trim(), actor: currentActor(), at }); caseLog(record, `收款 ${amount.toLocaleString("zh-TW")} 元（${method}）${note.trim() ? `；${note.trim()}` : ""}`); audit(data, "新增付款紀錄", id); });
  },
  checkoutProgress(id: string, started: boolean) {
    domainStore.update((data) => { const record = findCase(data, id); const at = new Date().toISOString(); if (started && !record.checkoutStartedAt) record.checkoutStartedAt = at; if (!started) { record.checkoutStartedAt = undefined; record.checkoutCompletedAt = undefined; } caseLog(record, started ? "開始返家檢查表" : "重新開啟返家檢查表"); });
  },
  completeCheckout(id: string) {
    domainStore.update((data) => { const record = findCase(data, id); if (record.checkoutChecklist.length < 1) throw new Error("請至少完成一項返家點交。"); record.checkoutStartedAt ??= new Date().toISOString(); record.checkoutCompletedAt = new Date().toISOString(); caseLog(record, `返家檢查表完成：${record.checkoutChecklist.join("、")}${record.checkoutNote ? `；備註：${record.checkoutNote}` : ""}`); audit(data, "完成返家檢查表", id); });
  },
  note(id: string, text: string) { if (!text.trim()) throw new Error("請填寫追蹤內容。"); domainStore.update((data) => { const record = findCase(data, id, true); caseLog(record, text.trim()); audit(data, "新增案件追蹤", id); }); },
  removeDraft(id: string) { domainStore.update((data) => { const record = findCase(data, id); if (record.signed || record.stage >= 2) throw new Error("案件已有下訂或入住歷程，請使用強制結案保留紀錄。"); data.cases = data.cases.filter((item) => item.id !== id); audit(data, "移除尚未下訂的預約草稿", id); }); },
  sign(id: string, image: string) {
    domainStore.update((data) => {
      const record = findCase(data, id); if (record.stage !== 3) throw new Error("請在合約階段完成簽名。");
      if (record.signed) throw new Error("原合約已簽署，請保留簽名與快照，條件異動另開變更單。");
      if (!record.contractNo || !record.reviewStart || !record.signedDate || record.reviewStart > record.signedDate) throw new Error("請先填寫收字號、簽約日與正確審閱日。");
      if (Date.parse(record.signedDate) - Date.parse(record.reviewStart) < data.contractSettings.reviewDays * 86_400_000) throw new Error(`簽名前請確認至少 ${data.contractSettings.reviewDays} 天的示範審閱期。`);
      record.signature = image; record.signed = true; record.contractVersion = 1;
      if (record.proxySigned && !record.proxyName?.trim()) throw new Error("代簽時請填寫代簽者姓名與關係。");
      record.contractStamp = currentActor();
      record.contractSnapshot = JSON.stringify({ name: record.name, phone: record.phone, contractNo: record.contractNo, roomType: record.roomType, days: record.days, hospital: record.hospital, priceClass: record.priceClass, corporateCompany: record.corporateCompany, amount: record.overrideAmount ?? record.quotedAmount, signedDate: record.signedDate, reviewDays: data.contractSettings.reviewDays, milkChoice: record.milkChoice, customerDetails: record.customerDetails, template: data.contractSettings.templates.find((item) => item.active), proxySigned: record.proxySigned, proxyName: record.proxyName, staffStamp: record.contractStamp });
      caseLog(record, "合約 v1 完成簽署，保留簽署快照");
    });
  },
  advance(id: string) {
    domainStore.update((data) => {
      const record = findCase(data, id); const reviewDays = record.signed && record.contractSnapshot ? JSON.parse(record.contractSnapshot).reviewDays ?? data.contractSettings.reviewDays : data.contractSettings.reviewDays; const errors = caseTransitionErrors(record, reviewDays); if (errors.length) throw new Error(errors.join("\n"));
      if (record.stage === 4) {
        if (!data.rooms.some((room) => room.room === record.room && room.enabled)) throw new Error("請使用房間主檔內的有效房號。");
        if (data.cases.some((item) => item.id !== id && item.room === record.room && item.actualAdmission && !item.dischargedAt)) throw new Error("此房已有入住個案，請選擇其他空房。");
        record.contractVersion = 2;
        record.contractV2Snapshot = JSON.stringify({ ...(record.contractSnapshot ? JSON.parse(record.contractSnapshot) : {}), actualAdmission: record.actualAdmission, reviewStart: record.reviewStart, version: 2 });
        if (!data.subjects.some((subject) => subject.caseId === id && subject.kind === "mama")) data.subjects.push({ id: `mama-${id}`, caseId: id, kind: "mama", room: record.room, name: record.name, motherName: record.name, chartNo: `M-${data.cases.indexOf(record) + 1}`, status: "入住", stayDay: 1 });
        reserveViewing(data, record); caseLog(record, "實際入住，產生合約 v2 與待指派視訊登記");
      }
      if (record.stage === 6) {
        if (record.dischargedAt) { record.closed = true; caseLog(record, "完成退房補登，保留原退房日期、托嬰與失效授權"); audit(data, "退房補登結案", id); return; }
        const babies = data.subjects.filter((subject) => subject.caseId === id && subject.kind === "baby" && !subject.historical);
        if (record.childcare) {
          const carNo = normalizeCartNo(record.childcareCar);
          if (!carNo || !babies.length || !Number.isFinite(record.childcareFee) || record.childcareFee < 0) throw new Error("托嬰須有已登錄寶寶、有效車號與費用。");
          if (data.bindings.some((binding) => !binding.ended && binding.babies.some((baby) => baby.babyId !== babies[0].id && normalizeCartNo(baby.cartNo) === carNo))) throw new Error("托嬰車號已被另一位寶寶使用。");
          record.childcareCar = carNo;
        }
        record.dischargedAt = data.demoAt; record.closed = true;
        data.subjects.filter((subject) => subject.caseId === id).forEach((subject) => {
          if (subject.kind === "baby" && record.childcare) { subject.room = ""; if (subject.id === babies[0]?.id) subject.carNo = record.childcareCar; subject.status = "托嬰"; }
          else { subject.status = "已退房"; subject.historical = true; subject.dischargedAt = record.dischargedAt; }
        });
        data.bindings.filter((binding) => binding.caseId === id).forEach((binding) => { binding.room = record.childcare ? "" : binding.room; if (!record.childcare) { data.cameraIntervals.filter((item) => item.bindingId === binding.id && !item.end).forEach((item) => { item.end = data.demoAt; }); binding.ended = true; data.careEvents.filter((event) => event.bindingId === binding.id && !event.end).forEach((event) => { event.end = data.demoAt; }); closeViewingHistory(data, binding.id, "退房或托嬰結束"); binding.sessions = []; } else if (!binding.ended) { const first = binding.babies.find((baby) => baby.babyId === babies[0]?.id); if (first) first.cartNo = record.childcareCar; binding.validTo = new Date(Date.parse(data.demoAt) + record.childcareDays * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }); } });
        caseLog(record, record.childcare ? "媽媽退房結案；寶寶續留托嬰，原有寶寶授權保留" : "退房結案；結束對應視訊授權");
      } else { caseLog(record, `${CASE_STAGES[record.stage]}完成，進入${CASE_STAGES[record.stage + 1]}`); record.completed.push(record.stage); record.stage = (record.stage + 1) as CaseRecord["stage"]; }
      audit(data, "案件階段完成", id);
    });
  },
  forceClose(id: string, reason: string) {
    if (!reason.trim()) throw new Error("請填寫強制結案原因。");
    domainStore.update((data) => { const record = findCase(data, id); record.previousStage = record.stage; record.closed = true; record.forced = true; caseLog(record, `強制結案；原階段${CASE_STAGES[record.stage]}；未完成${CASE_STAGES.slice(record.stage).join("、")}；原因：${reason.trim()}；入住狀態未變更`); audit(data, "強制結案", id); });
  },
  reopen(id: string, reason: string) {
    if (!["護理長 婉真", "管理者"].includes(getCurrentRole())) throw new Error("僅主管可重新開啟案件。");
    if (!reason.trim()) throw new Error("請填寫重開原因。");
    domainStore.update((data) => { const record = findCase(data, id, true); if (!record.closed) throw new Error("案件尚未結案。"); record.closed = false; record.stage = record.forced ? record.previousStage ?? record.stage : 6; record.forced = false; caseLog(record, `重新開啟；原因：${reason.trim()}；原視訊授權及房間不自動恢復`); audit(data, "重開案件", id); });
  },
  charge(id: string, label: string, amount: number, date: string, exceptionReason = "") {
    if (!label.trim() || !Number.isFinite(amount) || !date) throw new Error("請填寫項目、日期與有效金額。");
    domainStore.update((data) => { const record = findCase(data, id); const today = data.demoAt.slice(0, 10); if (date < today && (!["護理長 婉真", "管理者"].includes(getCurrentRole()) || !exceptionReason.trim())) throw new Error("今日以前帳務須主管授權並填寫急診例外原因。"); record.ledger.push({ id: crypto.randomUUID(), date, label, amount }); caseLog(record, `新增費用：${label}，${amount} 元${exceptionReason ? `；主管例外：${exceptionReason}` : ""}`); audit(data, "新增自費費用", id); });
  },
  change(id: string, days: number, roomType: CaseRecord["roomType"], reason: string, room?: string) {
    if (!reason.trim() || !Number.isInteger(days) || days < 1 || days > 365 || !["精緻", "VIP", "VILLA"].includes(roomType)) throw new Error("請填寫變更原因、1 至 365 天與有效房型。");
    if (!["護理長 婉真", "管理者"].includes(getCurrentRole())) throw new Error("合約變更需由主管授權。");
    domainStore.update((data) => {
      const record = findCase(data, id); if (!record.signed) throw new Error("尚未簽約請直接調整試算。");
      if (room && room !== record.room) {
        if (!record.actualAdmission || record.dischargedAt || !data.rooms.some((item) => item.room === room && item.enabled)) throw new Error("換房須為入住中個案並選擇有效房號。");
        if (data.cases.some((item) => item.id !== id && item.room === room && item.actualAdmission && !item.dischargedAt)) throw new Error("此房已有入住個案。");
        (record.roomMoves ??= []).push({ from: record.room, to: room, at: data.demoAt, reason: reason.trim(), actor: currentActor() });
        caseLog(record, `換房 ${record.room} → ${room}；${reason.trim()}`); record.room = room;
        data.subjects.filter((subject) => subject.caseId === id && !subject.historical).forEach((subject) => { subject.room = room; });
        data.bindings.filter((binding) => binding.caseId === id && !binding.ended).forEach((binding) => { binding.room = room; binding.internalTicket = crypto.randomUUID(); binding.familyTicket = crypto.randomUUID(); closeViewingHistory(data, binding.id, "換房重發"); binding.sessions = []; });
      }
      const before = casePrice(record); const next = casePrice({ ...record, days, roomType }); record.ledger.push({ id: crypto.randomUUID(), date: data.demoAt.slice(0, 10), label: `合約變更 ${record.days} → ${days} 天；${record.roomType} → ${roomType}；${reason.trim()}`, amount: next - before, before, after: next, actor: currentActor(), at: new Date().toISOString() }); record.days = days; record.roomType = roomType; caseLog(record, `變更單：前次試算 ${before}；目前試算 ${next}；${reason.trim()}`); audit(data, "合約變更單", id);
    });
  },
  adjustCharge(id: string, entryId: string, newAmount: number, reason: string) {
    if (!["護理長 婉真", "管理者"].includes(getCurrentRole()) || !reason.trim() || !Number.isFinite(newAmount)) throw new Error("帳務例外調整須主管授權、有效金額與原因。");
    domainStore.update((data) => { const record = findCase(data, id); const entry = record.ledger.find((item) => item.id === entryId && !item.adjustsId); if (!entry) throw new Error("找不到原收費項目。"); const before = entry.amount + record.ledger.filter((item) => item.adjustsId === entryId).reduce((sum, item) => sum + item.amount, 0); if (before === newAmount) return; record.ledger.push({ id: crypto.randomUUID(), date: entry.date, label: `主管例外：${entry.label} ${before} → ${newAmount}；${reason.trim()}`, amount: newAmount - before, adjustsId: entryId }); caseLog(record, `帳務例外調整 ${before} → ${newAmount}；${reason.trim()}（原項目保留）`); audit(data, "主管帳務例外調整", id); });
  },
  contractAmount(id: string, amount: number, reason: string) {
    if (!["護理長 婉真", "管理者"].includes(getCurrentRole()) || !reason.trim() || !Number.isFinite(amount) || amount < 0) throw new Error("合約金額變更須主管、有效金額與原因。");
    domainStore.update((data) => { const record = findCase(data, id); if (!record.signed) throw new Error("尚未簽約請回原案件試算。"); const before = (record.overrideAmount ?? record.quotedAmount) + record.ledger.filter((entry) => /^(合約變更|合約金額調整)/.test(entry.label)).reduce((sum, entry) => sum + entry.amount, 0); if (before === amount) return; record.ledger.push({ id: crypto.randomUUID(), date: data.demoAt.slice(0, 10), label: `合約金額調整；${reason.trim()}`, amount: amount - before, before, after: amount, actor: currentActor(), at: new Date().toISOString() }); caseLog(record, `合約金額調整 ${before} → ${amount}；${reason.trim()}`); audit(data, "合約金額變更單", id); });
  },
  meal(id: string, people: number, content: string) {
    domainStore.update((data) => { const record = findCase(data, id); if (record.actualAdmission !== data.demoAt.slice(0, 10)) throw new Error("餐飲人數／內容僅於入住當天可直接修改。"); if (!Number.isInteger(people) || people < 1 || people > 10 || !content.trim()) throw new Error("請填 1 至 10 位餐飲人數及內容。"); record.meal = { people, content: content.trim(), at: data.demoAt, actor: currentActor() }; caseLog(record, `入住當天餐飲：${people} 人；${content.trim()}`); });
  },
  returnPhoto(id: string, photo: string) { domainStore.update((data) => { const record = findCase(data, id, true); if (!photo || (record.returnPhotos?.length ?? 0) >= 6) throw new Error("返家照片最多 6 張。"); (record.returnPhotos ??= []).push(photo); caseLog(record, "保存返家照片於本機，未對外上傳"); }); },
  simulateReturnMail(id: string, email: string) { domainStore.update((data) => { const record = findCase(data, id, true); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !record.returnPhotos?.length) throw new Error("請先留存照片並填寫展示 Email。"); record.returnEmail = email; (record.returnMailLog ??= []).push({ at: new Date().toISOString(), actor: currentActor(), email }); caseLog(record, "返家照片寄送示意完成；未寄出郵件"); }); },
  updateChildcare(id: string, car: string, days: number, fee: number, contact: string, reason: string) {
    domainStore.update((data) => {
      const record = findCase(data, id, true); if (!record.childcare || record.childcareEnded || !record.dischargedAt) throw new Error("沒有進行中的托嬰合約。");
      const carNo = normalizeCartNo(car); if (!carNo || !Number.isInteger(days) || days < 1 || days > 365 || !Number.isFinite(fee) || fee < 0 || !contact.trim() || !reason.trim()) throw new Error("請填有效車號、天數、費用、接回人及異動原因。");
      const babies = data.subjects.filter((subject) => subject.caseId === id && subject.kind === "baby" && !subject.historical); const primary = babies[0];
      if (!primary || data.bindings.some((binding) => !binding.ended && binding.babies.some((baby) => baby.babyId !== primary.id && normalizeCartNo(baby.cartNo) === carNo))) throw new Error("找不到托嬰寶寶或車號已使用。");
      record.childcareCar = carNo; record.childcareDays = days; record.childcareFee = fee; record.childcareContact = contact.trim(); primary.carNo = carNo;
      data.bindings.filter((binding) => binding.caseId === id && !binding.ended).forEach((binding) => { const baby = binding.babies.find((item) => item.babyId === primary.id); if (baby) baby.cartNo = carNo; binding.validTo = new Date(Date.parse(record.dischargedAt) + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }); });
      caseLog(record, `托嬰條件異動：車 ${carNo}、${days} 天、每日 ${fee} 元；${reason.trim()}`); audit(data, "修改托嬰車號與期限", id);
    });
  },
  endChildcare(id: string) {
    domainStore.update((data) => { const record = findCase(data, id, true); if (!record.childcare || record.childcareEnded) throw new Error("沒有進行中的托嬰。"); record.childcareEnded = true; data.subjects.filter((subject) => subject.caseId === id && subject.kind === "baby").forEach((subject) => { subject.status = "已退房"; subject.historical = true; subject.dischargedAt = data.demoAt; }); data.bindings.filter((binding) => binding.caseId === id).forEach((binding) => { data.cameraIntervals.filter((item) => item.bindingId === binding.id && !item.end).forEach((item) => { item.end = data.demoAt; }); binding.ended = true; data.careEvents.filter((event) => event.bindingId === binding.id && !event.end).forEach((event) => { event.end = data.demoAt; }); closeViewingHistory(data, binding.id, "退房或托嬰結束"); binding.sessions = []; }); caseLog(record, "已確認接回，托嬰與觀看授權結束"); audit(data, "托嬰接回", id); });
  },
};
