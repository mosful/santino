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

export const OPS_ROOMS: OpsRoom[] = [
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

// 本階段不做（僅保留擴充彈性），不做為可互動快捷鍵
export const DEFERRED_ROOM_ITEMS = [
  "入住前一天三張通知單（餐飲單／嬰兒室住宿通知單／入住資訊單）",
  "房間每日清潔勾選表",
  "返家檢查表",
];
