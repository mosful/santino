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
