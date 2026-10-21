"use client";

import { audit, domainStore } from "@/lib/demo/domainStore";
import type { DemoDomain, RoomServiceStatus } from "./types";

export const ROOM_SERVICE_STATUSES: RoomServiceStatus[] = ["空房", "打掃中", "報修中"];

/** 首頁房況卡的顯示狀態：住客狀態優先，無住客時才看房間自己的房況。 */
export type RoomCardStatus = "入住" | "親子同室" | "托嬰" | "隔離" | RoomServiceStatus;

export function roomCardStatus(data: DemoDomain, room: string): RoomCardStatus {
  const mother = data.subjects.find(
    (subject) => subject.kind === "mama" && subject.room === room && !subject.historical
  );
  if (mother) return (mother.status as RoomCardStatus) ?? "入住";
  return data.rooms.find((item) => item.room === room)?.serviceStatus ?? "空房";
}

/**
 * 房況的彙總數字 —— 房況總覽頁的標題列與首頁的房況摘要條共用同一份。
 *
 * ⚠️ 不要在元件裡各算一次：兩邊只要有一處漏掉 `historical` 或 `enabled` 的過濾，
 * 首頁顯示的人數就會跟點進去看到的對不上。
 */
export function roomOccupancySummary(data: DemoDomain) {
  const today = data.demoAt.slice(0, 10);
  const rooms = data.rooms.filter((room) => room.enabled);
  const mothers = data.subjects.filter((subject) => subject.kind === "mama" && !subject.historical);
  return {
    rooms,
    mothers,
    babies: data.subjects.filter((subject) => subject.kind === "baby" && !subject.historical),
    childcare: data.cases.filter((record) => record.childcare && !record.childcareEnded),
    admissionsToday: data.cases.filter((record) => record.actualAdmission?.slice(0, 10) === today).length,
    dischargesToday: data.cases.filter((record) => record.dischargedAt?.slice(0, 10) === today).length,
    vacant: rooms.filter((room) => !mothers.some((subject) => subject.room === room.room)).length,
  };
}

export const roomActions = {
  /** 切換空房的房況（打掃中／報修中／空房）；有住客的房間不可由此切換。 */
  serviceStatus(room: string, status: RoomServiceStatus) {
    domainStore.update((data) => {
      const target = data.rooms.find((item) => item.room === room);
      if (!target) throw new Error("找不到房號。");
      if (data.subjects.some((subject) => subject.kind === "mama" && subject.room === room && !subject.historical)) {
        throw new Error("此房間目前有住客，請先完成退房再更新房況。");
      }
      target.serviceStatus = status;
      audit(data, `更新房況為${status}`, room);
    });
  },
};
