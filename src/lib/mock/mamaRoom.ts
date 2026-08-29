import { makeRng, makeUniqueNameGenerator } from "./genUtil";

export type RoomStatus = "入住" | "空房" | "親子同室" | "打掃" | "報修";

export type MamaRoom = {
  room: string;
  status: RoomStatus;
  motherName?: string;
  risk?: string;
  chartNo?: string;
  stayRange?: string;
  stayDay?: number;
  babyCount?: number;
  alert?: string;
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
  { room: "304", status: "打掃" },
  { room: "305", status: "入住", motherName: "張o雅", chartNo: "M20260825", stayRange: "08/25~09/22", stayDay: 3, babyCount: 1 },
  { room: "306", status: "報修" },
];

const EXTRA_ROOM_NOS = [
  "307", "308", "309", "310",
  "401", "402", "403", "404", "405", "406", "407", "408", "409", "410",
  "501", "502", "503", "504", "505", "506", "507", "508", "509", "510",
  "601", "602", "603", "604", "605", "606", "607", "608", "609", "610",
  "701", "702", "703", "704", "705", "706", "707", "708", "709", "710",
];

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
    babyCount: rng.bool(0.9) ? 1 : 2,
    alert: rng.pick(ALERTS),
  };
});

export const MAMA_ROOMS: MamaRoom[] = [...CURATED, ...GENERATED];

export const STATUS_COLOR: Record<RoomStatus, string> = {
  空房: "bg-white border-stone-200",
  入住: "bg-emerald-50 border-emerald-300",
  親子同室: "bg-pink-50 border-pink-300",
  打掃: "bg-amber-50 border-amber-300",
  報修: "bg-sky-50 border-sky-300",
};
