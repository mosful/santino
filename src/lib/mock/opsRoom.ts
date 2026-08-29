import { makeRng, makeUniqueNameGenerator } from "./genUtil";

export type OpsRoom = {
  room: string;
  roomType: "精緻房" | "VIP房" | "VILLA";
  motherName?: string;
  chartNo?: string;
  stayDay?: number;
  fee?: number;
  received?: number;
  prepaid?: number;
  mealNote?: string;
  vacant?: boolean;
};

const CURATED: OpsRoom[] = [
  {
    room: "301",
    roomType: "精緻房",
    motherName: "邱o乾",
    chartNo: "M20260812",
    stayDay: 16,
    fee: 6800,
    received: 108800,
    prepaid: 20000,
    mealNote: "無特殊禁忌",
  },
  {
    room: "302",
    roomType: "VIP房",
    motherName: "林o臻",
    chartNo: "M20260820",
    stayDay: 8,
    fee: 9800,
    received: 78400,
    prepaid: 30000,
    mealNote: "海鮮過敏",
  },
  { room: "303", roomType: "精緻房", vacant: true },
  { room: "306", roomType: "VILLA", vacant: true },
];

const EXTRA_ROOM_NOS = [
  "304", "305", "307", "308", "309", "310",
  "401", "402", "403", "404", "405", "406", "407", "408", "409", "410",
  "501", "502", "503", "504", "505", "506", "507", "508", "509", "510",
  "601", "602", "603", "604", "605", "606", "607", "608", "609", "610",
  "701", "702", "703", "704", "705", "706", "707", "708", "709", "710",
  "711",
];

const ROOM_TYPES: OpsRoom["roomType"][] = ["精緻房", "精緻房", "精緻房", "VIP房", "VIP房", "VILLA"];
const MEAL_NOTES = ["無特殊禁忌", "海鮮過敏", "麩質不耐", "無特殊禁忌", "無特殊禁忌", "乳製品過敏"];
const FEE_BY_TYPE: Record<OpsRoom["roomType"], number> = { 精緻房: 6800, VIP房: 9800, VILLA: 15800 };

const rng = makeRng(4004);
const nextName = makeUniqueNameGenerator(
  rng,
  CURATED.map((r) => r.motherName).filter((n): n is string => !!n)
);
const GENERATED: OpsRoom[] = EXTRA_ROOM_NOS.map((room) => {
  const roomType = rng.pick(ROOM_TYPES);
  const vacant = rng.bool(0.25);
  if (vacant) return { room, roomType, vacant: true };
  const stayDay = rng.int(1, 28);
  const fee = FEE_BY_TYPE[roomType];
  const received = fee * stayDay - rng.int(0, 3) * fee;
  return {
    room,
    roomType,
    motherName: nextName(),
    chartNo: `M2026${String(rng.int(8, 9)).padStart(2, "0")}${String(rng.int(1, 27)).padStart(2, "0")}${room}`,
    stayDay,
    fee,
    received,
    prepaid: rng.int(1, 3) * 10000,
    mealNote: rng.pick(MEAL_NOTES),
  };
});

export const OPS_ROOMS: OpsRoom[] = [...CURATED, ...GENERATED];

// 本階段不做（僅保留擴充彈性），不做為可互動快捷鍵
export const DEFERRED_ROOM_ITEMS = [
  "入住前一天三張通知單（餐飲單／嬰兒室住宿通知單／入住資訊單）",
  "房間每日清潔勾選表",
  "返家檢查表",
  "返家照片留Mail（訪談整理v2 §3.6新增項目）",
];
