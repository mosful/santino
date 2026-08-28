export type BabyStatus = "入住" | "隔離" | "親子同室" | "視訊";
export type BabyGender = "男" | "女";

export type BabyRoom = {
  room: string;
  status: BabyStatus;
  gender?: BabyGender;
  babyName?: string;
  chartNo?: string;
  birthDate?: string;
  weight?: string;
  videoState?: string;
};

export const BABY_ROOMS: BabyRoom[] = [
  {
    room: "301",
    status: "入住",
    gender: "男",
    babyName: "邱小弟",
    chartNo: "B20260812",
    birthDate: "2026-08-12",
    weight: "3.2kg",
    videoState: "正常視訊",
  },
  {
    room: "302",
    status: "親子同室",
    gender: "女",
    babyName: "林小妹",
    chartNo: "B20260820",
    birthDate: "2026-08-20",
    weight: "3.0kg",
    videoState: "親子同室中",
  },
  {
    room: "305",
    status: "隔離",
    gender: "女",
    babyName: "張小妹",
    chartNo: "B20260825",
    birthDate: "2026-08-25",
    weight: "2.8kg",
    videoState: "隔離中",
  },
];

export const BABY_STATUS_COLOR: Record<BabyStatus, string> = {
  入住: "bg-sky-50 border-sky-300",
  隔離: "bg-amber-50 border-amber-300",
  親子同室: "bg-purple-50 border-purple-300",
  視訊: "bg-emerald-50 border-emerald-300",
};
