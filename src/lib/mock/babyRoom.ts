import { makeRng, makeCycler, SURNAMES } from "./genUtil";
import { MAMA_ROOMS } from "./mamaRoom";

export type BabyStatus = "入住" | "隔離" | "親子同室" | "視訊" | "空房";
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

// 房號與入住狀態改由 MAMA_ROOMS 衍生（同一房號的媽媽/寶寶必須對應），
// 這裡只保留精選範例的寶寶專屬欄位（姓名/性別/出生等），媽媽照護若無入住則本模組顯示空房。
const CURATED_OVERRIDE: Record<string, Omit<BabyRoom, "room">> = {
  "301": {
    status: "入住",
    gender: "男",
    babyName: "邱小弟",
    chartNo: "B20260812",
    birthDate: "2026-08-12",
    weight: "3.2kg",
    videoState: "正常視訊",
  },
  "302": {
    status: "親子同室",
    gender: "女",
    babyName: "林小妹",
    chartNo: "B20260820",
    birthDate: "2026-08-20",
    weight: "3.0kg",
    videoState: "親子同室中",
  },
  "305": {
    status: "隔離",
    gender: "女",
    babyName: "張小妹",
    chartNo: "B20260825",
    birthDate: "2026-08-25",
    weight: "2.8kg",
    videoState: "隔離中",
  },
};

// 隨機狀態不含「親子同室」：該狀態與媽媽房卡的「親子同室」是同一件事，直接沿用媽媽端狀態。
const STATUS_WEIGHTED: BabyStatus[] = ["入住", "入住", "入住", "入住", "視訊", "視訊", "隔離"];

const CURATED_COMBOS = new Set(
  Object.values(CURATED_OVERRIDE).map((c) => `${c.babyName?.[0]}-${c.gender}`)
);
const NAME_COMBOS = SURNAMES.flatMap((s) => [
  { surname: s, gender: "男" as BabyGender },
  { surname: s, gender: "女" as BabyGender },
]).filter((c) => !CURATED_COMBOS.has(`${c.surname}-${c.gender}`));

const rng = makeRng(3003);
const nameCycler = makeCycler(rng, NAME_COMBOS);

export const BABY_ROOMS: BabyRoom[] = MAMA_ROOMS.map((mr): BabyRoom => {
  const occupied = mr.status === "入住" || mr.status === "親子同室";
  if (!occupied) return { room: mr.room, status: "空房" };

  const override = CURATED_OVERRIDE[mr.room];
  if (override) return { room: mr.room, ...override };

  const { value: combo, round } = nameCycler();
  const status: BabyStatus = mr.status === "親子同室" ? "親子同室" : rng.pick(STATUS_WEIGHTED);
  const month = rng.int(8, 9);
  const day = rng.int(1, 27);
  const videoState =
    status === "入住" || status === "視訊"
      ? "正常視訊"
      : status === "親子同室"
      ? "親子同室中"
      : "隔離中";
  const label = combo.gender === "男" ? "小弟" : "小妹";
  return {
    room: mr.room,
    status,
    gender: combo.gender,
    babyName: round === 1 ? `${combo.surname}${label}` : `${combo.surname}${label}(${round})`,
    chartNo: `B2026${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}${mr.room}`,
    birthDate: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    weight: `${(rng.int(24, 38) / 10).toFixed(1)}kg`,
    videoState,
  };
});

export const BABY_STATUS_COLOR: Record<BabyStatus, string> = {
  入住: "bg-sky-50 border-sky-300",
  隔離: "bg-amber-50 border-amber-300",
  親子同室: "bg-purple-50 border-purple-300",
  視訊: "bg-emerald-50 border-emerald-300",
  空房: "bg-white border-stone-200",
};
