import { makeRng, makeUniqueNameGenerator } from "./genUtil";
import { ROOM_NOS } from "./roomMaster";

export type RoomStatus = "入住" | "空房" | "親子同室" | "打掃" | "報修" | "已退房";

export type MamaRoom = {
  caseId?: string;
  room: string;
  status: RoomStatus;
  motherName?: string;
  risk?: string;
  chartNo?: string;
  stayRange?: string;
  stayDay?: number;
  babyCount?: number;
  alert?: string;
  dischargedAt?: string;
  historical?: boolean;
};

const CURATED: MamaRoom[] = [
  {
    room: "301",
    status: "入住",
    motherName: "邱o乾",
    risk: "脆弱",
    chartNo: "M20260812",
    stayRange: "08/12~09/12",
    stayDay: 16,
    babyCount: 1,
    alert: "護理指導單未簽",
  },
  { room: "302", status: "親子同室", motherName: "林o臻", chartNo: "M20260820", stayRange: "08/20~09/17", stayDay: 8, babyCount: 1 },
  { room: "303", status: "空房" },
  { room: "305", status: "入住", motherName: "張o雅", chartNo: "M20260825", stayRange: "08/25~09/22", stayDay: 3, babyCount: 1 },
  { room: "306", status: "打掃" },
  { room: "307", status: "報修" },
];

/*
  其餘房號一律由房號主檔推導，不再手寫。

  ⚠️ 原本這裡寫死 301–710 共 50 間，是虛構的；實際只有 27 間且各樓層跳過 04
  （見 roomMaster.ts）。手寫清單與主檔不同步時，寶寶視訊綁定的房號會對不上
  院務系統的房號，而且不會有任何錯誤訊息。
*/
const CURATED_ROOMS = new Set(CURATED.map((item) => item.room));
const EXTRA_ROOM_NOS = ROOM_NOS.filter((room) => !CURATED_ROOMS.has(room));

const STATUS_WEIGHTED: RoomStatus[] = [
  "入住", "入住", "入住", "入住", "入住",
  "親子同室", "親子同室",
  "空房", "空房", "空房",
  "打掃",
  "報修",
];
const RISKS = ["脆弱", "高危險跌倒", "妊娠糖尿病", undefined, undefined, undefined];
const ALERTS = ["護理指導單未簽", "同意書未簽", undefined, undefined, undefined];

const rng = makeRng(2002);
const nextName = makeUniqueNameGenerator(
  rng,
  CURATED.map((r) => r.motherName).filter((n): n is string => !!n)
);
const GENERATED: MamaRoom[] = EXTRA_ROOM_NOS.map((room) => {
  const status = rng.pick(STATUS_WEIGHTED);
  const occupied = status === "入住" || status === "親子同室";
  if (!occupied) return { room, status };
  const stayDay = rng.int(1, 28);
  const month = rng.int(8, 9);
  const startDay = rng.int(1, 27);
  return {
    room,
    status,
    motherName: nextName(),
    risk: rng.pick(RISKS),
    chartNo: `M2026${String(month).padStart(2, "0")}${String(startDay).padStart(2, "0")}${room}`,
    stayRange: `0${month}/${String(startDay).padStart(2, "0")}~${month === 8 ? "09" : "10"}/${String(startDay).padStart(2, "0")}`,
    stayDay,
    babyCount: 1,
    alert: rng.pick(ALERTS),
  };
});

export const MAMA_ROOMS: MamaRoom[] = [...CURATED, ...GENERATED];

/** 當日上午退房、但護理紀錄尚未完成的原型個案。房號可已由下午新住客使用。 */
export const DISCHARGED_MAMA_RECORDS: MamaRoom[] = [
  {
    caseId: "discharged-M20260901301",
    room: "301",
    status: "已退房",
    motherName: "陳o臻",
    chartNo: "M20260901",
    stayRange: "09/01~09/11",
    stayDay: 11,
    babyCount: 1,
    alert: "媽媽護理紀錄待回補",
    dischargedAt: "2026-09-11 09:15",
    historical: true,
  },
  {
    caseId: "discharged-M20260820505",
    room: "505",
    status: "已退房",
    motherName: "郭o涵",
    chartNo: "M20260820",
    stayRange: "08/20~09/11",
    stayDay: 23,
    babyCount: 1,
    alert: "持續護理紀錄待確認",
    dischargedAt: "2026-09-11 10:05",
    historical: true,
  },
];

export const STATUS_COLOR: Record<RoomStatus, string> = {
  空房: "bg-white border-stone-200",
  入住: "bg-emerald-50 border-emerald-300",
  親子同室: "bg-pink-50 border-pink-300",
  打掃: "bg-amber-50 border-amber-300",
  報修: "bg-sky-50 border-sky-300",
  已退房: "bg-stone-100 border-stone-400",
};
