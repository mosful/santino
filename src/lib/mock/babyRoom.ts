import { makeRng, makeCycler, SURNAMES } from "./genUtil";
import { MAMA_ROOMS } from "./mamaRoom";
import { babyDisplayName } from "../babycam/wristband";

export type BabyStatus = "入住" | "隔離" | "親子同室" | "視訊" | "托嬰" | "空房";
export type BabyGender = "男" | "女";

export type BabyRoom = {
  caseId?: string;
  room: string;
  carNo?: string;
  /** 托嬰寶寶的媽媽退房前住的房號；托嬰沒有房號，靠這個回溯是哪一房的寶寶。 */
  previousRoom?: string;
  boarding?: boolean;
  status: BabyStatus;
  gender?: BabyGender;
  /** 胎序：單胞胎 0，多胞胎 1、2…。標籤的 A／B 由它決定。 */
  birthOrder?: number;
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

const RESIDENT_BABY_ROOMS: BabyRoom[] = MAMA_ROOMS.map((mr): BabyRoom => {
  const occupied = mr.status === "入住" || mr.status === "親子同室";
  if (!occupied) return { room: mr.room, status: "空房" };

  // 寶寶名稱一律由媽媽姓名推導（見 babyDisplayName）；精選範例只保留性別與出生等寶寶欄位。
  const override = CURATED_OVERRIDE[mr.room];
  if (override) return { room: mr.room, ...override, babyName: babyDisplayName(mr.motherName!, override.gender) };

  const { value: combo } = nameCycler();
  const status: BabyStatus = mr.status === "親子同室" ? "親子同室" : rng.pick(STATUS_WEIGHTED);
  const month = rng.int(8, 9);
  const day = rng.int(1, 27);
  const videoState =
    status === "入住" || status === "視訊"
      ? "正常視訊"
      : status === "親子同室"
      ? "親子同室中"
      : "隔離中";
  return {
    room: mr.room,
    status,
    gender: combo.gender,
    babyName: babyDisplayName(mr.motherName!, combo.gender),
    chartNo: `B2026${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}${mr.room}`,
    birthDate: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    weight: `${(rng.int(24, 38) / 10).toFixed(1)}kg`,
    videoState,
  };
});

export const BOARDING_BABIES: BabyRoom[] = [
  {
    caseId: "boarding-B20260818001",
    room: "",
    carNo: "07",
    previousRoom: "502",
    boarding: true,
    status: "托嬰",
    gender: "男",
    babyName: "周○柔之子",
    chartNo: "B20260818001",
    birthDate: "2026-08-18",
    weight: "3.4kg",
    videoState: "托嬰照護中",
  },
  {
    caseId: "boarding-B20260822002",
    room: "",
    carNo: "12",
    previousRoom: "506",
    boarding: true,
    status: "托嬰",
    gender: "女",
    babyName: "許○涵之女",
    chartNo: "B20260822002",
    birthDate: "2026-08-22",
    weight: "3.1kg",
    videoState: "托嬰照護中",
  },
];

/*
  雙胞胎示範（客戶 2026-10-29）：手圈標籤要看得出「○○○之子A／之女B」，
  示範資料裡就得真的有一組雙胞胎，否則畫面上永遠只印得出不帶字母的名字。
  挑 203 房（狀態單純的入住房）：老大設胎序 1、妹妹補一筆胎序 2，同房同媽媽。
  ⚠️ 病歷號不可共用，二寶補尾碼 B——照護草稿與簽名都以病歷號識別個案。
*/
const TWIN_ROOM = "203";
const twinElder = RESIDENT_BABY_ROOMS.find((room) => room.room === TWIN_ROOM && room.babyName);
const twinMother = MAMA_ROOMS.find((room) => room.room === TWIN_ROOM)?.motherName;
const TWIN_SIBLING: BabyRoom[] = [];
if (twinElder && twinMother) {
  TWIN_SIBLING.push({
    ...twinElder,
    gender: "女",
    birthOrder: 2,
    babyName: babyDisplayName(twinMother, "女", 2),
    chartNo: `${twinElder.chartNo}B`,
    weight: "2.9kg",
  });
  twinElder.gender = "男";
  twinElder.birthOrder = 1;
  twinElder.babyName = babyDisplayName(twinMother, "男", 1);
}

export const BABY_ROOMS: BabyRoom[] = [...BOARDING_BABIES, ...RESIDENT_BABY_ROOMS, ...TWIN_SIBLING];

export const BABY_STATUS_COLOR: Record<BabyStatus, string> = {
  入住: "bg-sky-50 border-sky-300",
  隔離: "bg-amber-50 border-amber-300",
  親子同室: "bg-purple-50 border-purple-300",
  視訊: "bg-emerald-50 border-emerald-300",
  托嬰: "bg-violet-50 border-violet-300",
  空房: "bg-white border-stone-200",
};
