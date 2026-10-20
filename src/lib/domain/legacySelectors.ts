"use client";

import { useDomainStore } from "../demo/domainStore";
import { OPS_ROOMS as ROOM_SEED, type OpsRoom } from "../mock/opsRoom";
import type { Contract } from "../mock/contract";
import type { Customer } from "../mock/customer";
import type { JourneyMother } from "../mock/customerJourney";
import { caseStageName } from "./stages";
import { useCareStore } from "../care/store";
import { roleTaskCategories, taskEvents } from "./tasks";
import { useCurrentRole } from "../roleStore";
import { CASE_STAGES } from "./types";

export function useOpsRooms(): OpsRoom[] {
  const { data } = useDomainStore();
  return data.rooms.filter((room) => room.enabled).map((room) => {
    const seed: OpsRoom = { ...(ROOM_SEED.find((item) => item.room === room.room) ?? { room: room.room }), roomType: (data.roomTypes.find((type) => type.id === (room.typeId || room.roomType))?.name ?? room.roomType) as OpsRoom["roomType"] };
    const mother = data.subjects.find((subject) => subject.kind === "mama" && subject.room === seed.room && !subject.historical);
    const record = mother && data.cases.find((item) => item.id === mother.caseId);
    return mother ? { ...seed, motherName: mother.name, chartNo: mother.chartNo, stayDay: mother.stayDay, vacant: false, fee: record ? Math.round((record.overrideAmount ?? record.quotedAmount) / record.days) : seed.fee, received: record?.deposit ?? seed.received } : { ...seed, motherName: undefined, chartNo: undefined, stayDay: undefined, vacant: true };
  });
}
export function useContractRows(): (Contract & { caseId: string })[] {
  const { data } = useDomainStore();
  return data.cases.filter((record) => record.contractNo).map((record) => ({ id: record.legacyId, caseId: record.id, contractNo: record.contractNo, motherName: record.name, dueDate: record.dueDate, scheduledAdmission: record.actualAdmission, scheduledDays: record.days, totalAmount: record.overrideAmount ?? record.quotedAmount, signDate: record.signedDate, signer: record.signed ? "本案媽媽" : "待簽署", status: record.signed ? "已簽約" : "草稿", deposit: record.deposit }));
}
export function useCustomerRows(): (Customer & { caseId: string })[] {
  const { data } = useDomainStore();
  return data.cases.map((record) => ({ id: record.legacyId, caseId: record.id, name: record.name, level: record.customerDetails?.level ?? "一般客戶", parity: record.customerDetails?.parity ?? "待確認", phone: record.phone, birthday: record.customerDetails?.birthday ?? "", dueDate: record.dueDate, contractNo: record.contractNo, signDate: record.signedDate, referrer: record.customerDetails?.referrer ?? record.source, mainStaff: record.owner, mainNurse: record.customerDetails?.mainNurse ?? "待指派", visitDate: record.visitDate, lineBound: record.customerDetails?.lineBound ?? false, family: record.customerDetails?.family ?? (record.childcareContact || "待確認") }));
}
export function useJourneyMothers(): JourneyMother[] {
  const { data } = useDomainStore();
  const { data: care } = useCareStore();
  const role = useCurrentRole();

  /*
    緊急度由該案件「尚未處理的待辦」推算，與今日工作台的到期清單同一份來源。

    ⚠️ 以前這裡一律寫死 "normal"，導致首頁的「逾期待辦」「今日追蹤」永遠是 0、
    對應的快速檢視也永遠空白——畫面上明明列著逾期的待收款，數字卻說 0。
    要改判定條件請連同 lib/domain/tasks.ts 一起看，不要只改這裡。
  */
  const today = data.demoAt.slice(0, 10);
  const own = roleTaskCategories(role);
  const nextWeek = new Date(Date.parse(`${today}T00:00:00+08:00`) + 7 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  const byCase = new Map<string, { urgency: JourneyMother["urgency"]; title: string; date: string }>();
  for (const event of taskEvents(data, care)) {
    if (event.handled || !own.includes(event.category)) continue;
    const caseId = event.id.split(":")[0];
    const urgency: JourneyMother["urgency"] =
      event.date < today ? "overdue" : event.date === today ? "today" : event.date <= nextWeek ? "upcoming" : "normal";
    const rank = { overdue: 3, today: 2, upcoming: 1, normal: 0 } as const;
    const current = byCase.get(caseId);
    // 同一案件有多筆待辦時取最緊急的那一筆當代表。
    if (!current || rank[urgency] > rank[current.urgency]) byCase.set(caseId, { urgency, title: event.title, date: event.date });
  }

  // 階段一對一：首頁漏斗與案件流程用同一組七階段，結案案件（含寶寶續留托嬰）歸「已結案」。
  return data.cases.filter((record) => !record.closed || (record.childcare && !record.childcareEnded)).map((record) => {
    const hit = byCase.get(record.id);
    return { id: record.legacyId, name: record.name, stage: record.closed ? "已結案" : caseStageName(record.stage), status: record.closed ? "媽媽退房／寶寶續留" : CASE_STAGES[record.stage], dueDate: record.dueDate || undefined, room: record.childcare && record.dischargedAt ? `車 ${record.childcareCar}` : record.room || undefined, owner: record.owner, nextAction: hit ? hit.title.split("｜").at(-1)! : `${CASE_STAGES[record.stage]}階段待處理`, actionDate: hit ? hit.date : record.visitDate || "待安排", urgency: hit?.urgency ?? "normal", tags: [record.contractNo || "未下訂", record.draftAt ? "有暫存" : "待處理"] };
  });
}
