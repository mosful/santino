import { makeRng, makeCycler, SURNAMES } from "./genUtil";

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

const CURATED: BabyRoom[] = [
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

const EXTRA_ROOM_NOS = [
  "306", "307", "308", "309", "310",
  "401", "402", "403", "404", "405", "406", "407", "408", "409", "410",
  "501", "502", "503", "504", "505", "506", "507", "508", "509", "510",
  "601", "602", "603", "604", "605", "606", "607", "608", "609", "610",
  "701", "702", "703", "704", "705", "706", "707", "708", "709", "710",
  "711", "712",
];

const STATUS_WEIGHTED: BabyStatus[] = ["入住", "入住", "入住", "入住", "視訊", "視訊", "親子同室", "隔離"];

// 姓氏×性別組合（最多60種不重複），排除已被CURATED精選範例佔用的組合
const CURATED_COMBOS = new Set(CURATED.map((c) => `${c.babyName?.[0]}-${c.gender}`));
const NAME_COMBOS = SURNAMES.flatMap((s) => [
  { surname: s, gender: "男" as BabyGender },
  { surname: s, gender: "女" as BabyGender },
]).filter((c) => !CURATED_COMBOS.has(`${c.surname}-${c.gender}`));

const rng = makeRng(3003);
const nameCycler = makeCycler(rng, NAME_COMBOS);
const GENERATED: BabyRoom[] = EXTRA_ROOM_NOS.map((room) => {
  const { value: combo, round } = nameCycler();
  const status = rng.pick(STATUS_WEIGHTED);
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
    room,
    status,
    gender: combo.gender,
    babyName: round === 1 ? `${combo.surname}${label}` : `${combo.surname}${label}(${round})`,
    chartNo: `B2026${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}${room}`,
    birthDate: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    weight: `${(rng.int(24, 38) / 10).toFixed(1)}kg`,
    videoState,
  };
});

export const BABY_ROOMS: BabyRoom[] = [...CURATED, ...GENERATED];

export const BABY_STATUS_COLOR: Record<BabyStatus, string> = {
  入住: "bg-sky-50 border-sky-300",
  隔離: "bg-amber-50 border-amber-300",
  親子同室: "bg-purple-50 border-purple-300",
  視訊: "bg-emerald-50 border-emerald-300",
};
