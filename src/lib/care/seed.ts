import { BABY_ROOMS } from "../mock/babyRoom";
import { DISCHARGED_MAMA_RECORDS, MAMA_ROOMS } from "../mock/mamaRoom";
import type { CareSubject } from "./types";
import { babyDisplayName } from "../babycam/wristband";

/** 以病歷個案識別，退房後同一房的新住客不會共用草稿或簽名。 */
export const CARE_SUBJECTS: CareSubject[] = [
  ...MAMA_ROOMS.filter((room) => room.motherName).map((room) => ({
    id: `mama-${room.chartNo}`, caseId: `stay-${room.chartNo}`, kind: "mama" as const,
    room: room.room, name: room.motherName!, motherName: room.motherName!, chartNo: room.chartNo!,
    status: room.status, stayDay: room.stayDay ?? 1,
  })),
  ...BABY_ROOMS.filter((room) => room.babyName).map((room) => {
    const mother = MAMA_ROOMS.find((item) => item.room === room.room);
    return {
      id: `baby-${room.chartNo}`, caseId: mother ? `stay-${mother.chartNo}` : room.caseId!, kind: "baby" as const,
      room: room.boarding ? "" : room.room, carNo: room.carNo, previousRoom: room.previousRoom,
      // 寶寶跟著媽媽叫：原本取自寶寶產生器的姓氏，換房間時看起來像沒跟著切換（客戶回報）。
      name: mother?.motherName ? babyDisplayName(mother.motherName, room.gender) : room.babyName!,
      motherName: mother?.motherName ?? "示範托嬰媽媽", chartNo: room.chartNo!, status: room.status,
      stayDay: mother?.stayDay ?? 1, birthDate: room.birthDate, gender: room.gender,
    };
  }),
  ...DISCHARGED_MAMA_RECORDS.flatMap((room, index) => {
    const dischargedAt = index === 0 ? "2026-10-15T09:15:00+08:00" : "2026-10-10T10:05:00+08:00";
    const base = { caseId: room.caseId!, room: room.room, motherName: room.motherName!, status: "已退房", stayDay: room.stayDay ?? 1, historical: true, dischargedAt };
    return [
      { ...base, id: `mama-${room.caseId}`, kind: "mama" as const, name: room.motherName!, chartNo: room.chartNo! },
      { ...base, id: `baby-${room.caseId}`, kind: "baby" as const, name: babyDisplayName(room.motherName!, undefined), chartNo: `B-${room.chartNo}` },
    ];
  }),
];
export const careSubject = (id: string) => CARE_SUBJECTS.find((subject) => subject.id === id);
