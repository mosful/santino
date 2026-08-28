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

export const MAMA_ROOMS: MamaRoom[] = [
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

export const STATUS_COLOR: Record<RoomStatus, string> = {
  空房: "bg-white border-stone-200",
  入住: "bg-emerald-50 border-emerald-300",
  親子同室: "bg-pink-50 border-pink-300",
  打掃: "bg-amber-50 border-amber-300",
  報修: "bg-sky-50 border-sky-300",
};
