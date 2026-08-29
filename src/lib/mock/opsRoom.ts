import { makeRng } from "./genUtil";
import { MAMA_ROOMS } from "./mamaRoom";

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

// 房型（精緻房/VIP房/VILLA）為房間本身的固定屬性，與2.媽媽照護共用房號，
// 因此改由 MAMA_ROOMS 衍生出住房狀態與孕媽姓名／病歷號，確保「同一房號」在
// 媽媽照護、房間動態、月子餐等模組看到的是同一位客戶，不是各自獨立亂數出來的假資料。
const ROOM_TYPE_OVERRIDE: Record<string, OpsRoom["roomType"]> = {
  "301": "精緻房",
  "302": "VIP房",
  "303": "精緻房",
  "306": "VILLA",
};
const ROOM_TYPES: OpsRoom["roomType"][] = ["精緻房", "精緻房", "精緻房", "VIP房", "VIP房", "VILLA"];
const MEAL_NOTES = ["無特殊禁忌", "海鮮過敏", "麩質不耐", "無特殊禁忌", "無特殊禁忌", "乳製品過敏"];
const FEE_BY_TYPE: Record<OpsRoom["roomType"], number> = { 精緻房: 6800, VIP房: 9800, VILLA: 15800 };

const rng = makeRng(4004);
function roomTypeFor(room: string): OpsRoom["roomType"] {
  return ROOM_TYPE_OVERRIDE[room] ?? rng.pick(ROOM_TYPES);
}

const FROM_MAMA_ROOMS: OpsRoom[] = MAMA_ROOMS.map((mr) => {
  const roomType = roomTypeFor(mr.room);
  const occupied = mr.status === "入住" || mr.status === "親子同室";
  if (!occupied) return { room: mr.room, roomType, vacant: true };
  const stayDay = mr.stayDay ?? rng.int(1, 28);
  const fee = FEE_BY_TYPE[roomType];
  const received = fee * stayDay - rng.int(0, 3) * fee;
  return {
    room: mr.room,
    roomType,
    motherName: mr.motherName,
    chartNo: mr.chartNo,
    stayDay,
    fee,
    received,
    prepaid: rng.int(1, 3) * 10000,
    mealNote: rng.pick(MEAL_NOTES),
  };
});

// 711：房間動態獨有的額外房號（媽媽照護房卡最多到710），維持50→51間的既有規模
const EXTRA_ROOM: OpsRoom = { room: "711", roomType: "精緻房", vacant: true };

export const OPS_ROOMS: OpsRoom[] = [...FROM_MAMA_ROOMS, EXTRA_ROOM];

// 本階段不做（僅保留擴充彈性），不做為可互動快捷鍵
export const DEFERRED_ROOM_ITEMS = [
  "入住前一天三張通知單（餐飲單／嬰兒室住宿通知單／入住資訊單）",
  "房間每日清潔勾選表",
  "返家檢查表",
  "返家照片留Mail（訪談整理v2 §3.6新增項目）",
];
