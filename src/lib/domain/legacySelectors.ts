"use client";

import { useDomainStore } from "../demo/domainStore";
import { OPS_ROOMS as ROOM_SEED, type OpsRoom } from "../mock/opsRoom";
import type { Contract } from "../mock/contract";
import type { Customer } from "../mock/customer";
import type { JourneyMother, JourneyStageKey } from "../mock/customerJourney";
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
  const stageMap: JourneyStageKey[] = ["consultation", "consultation", "contract", "contract", "preAdmission", "staying", "discharge"];
  return data.cases.filter((record) => !record.closed || (record.childcare && !record.childcareEnded)).map((record) => ({ id: record.legacyId, name: record.name, stage: record.closed ? "followUp" : stageMap[record.stage], status: record.closed ? "媽媽退房／寶寶續留" : CASE_STAGES[record.stage], dueDate: record.dueDate || undefined, room: record.childcare && record.dischargedAt ? `車 ${record.childcareCar}` : record.room || undefined, owner: record.owner, nextAction: `${CASE_STAGES[record.stage]}階段待處理`, actionDate: record.visitDate || "待安排", urgency: "normal", tags: [record.contractNo || "未下訂", record.draftAt ? "有暫存" : "待處理"] }));
}
