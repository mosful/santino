import { makeRng, makeUniqueNameGenerator, phoneNumber, addDays, pad2 } from "./genUtil";

export type Customer = {
  id: number;
  name: string;
  level: string;
  parity: string; // 胎次
  phone: string;
  birthday: string;
  dueDate: string;
  contractNo?: string;
  signDate?: string;
  referrer: string;
  mainStaff: string;
  mainNurse: string;
  visitDate?: string;
  lineBound: boolean;
  family: string;
};

const CURATED: Customer[] = [
  {
    id: 1,
    name: "邱o乾",
    level: "一般客戶",
    parity: "第一胎",
    phone: "0912-345-678",
    birthday: "1993-04-12",
    dueDate: "2026-09-15",
    contractNo: "A115082801",
    signDate: "2026-08-01",
    referrer: "陳醫師",
    mainStaff: "櫃臺-小美",
    mainNurse: "護理師-雅婷",
    lineBound: true,
    family: "先生：邱o翰",
  },
  {
    id: 2,
    name: "林o臻",
    level: "VIP客戶",
    parity: "第二胎",
    phone: "0922-111-222",
    birthday: "1990-11-02",
    dueDate: "2026-09-28",
    referrer: "網路搜尋",
    mainStaff: "櫃臺-阿凱",
    mainNurse: "－",
    lineBound: false,
    family: "－",
  },
  {
    id: 3,
    name: "張o雅",
    level: "一般客戶",
    parity: "第一胎",
    phone: "0933-444-555",
    birthday: "1996-06-20",
    dueDate: "2026-10-05",
    visitDate: "2026-08-25",
    referrer: "朋友介紹",
    mainStaff: "櫃臺-小美",
    mainNurse: "－",
    lineBound: true,
    family: "媽媽：張o蓮",
  },
];

const LEVELS = ["一般客戶", "VIP客戶"];
const PARITY = ["第一胎", "第二胎", "第三胎"];
const REFERRERS = ["陳醫師", "網路搜尋", "朋友介紹", "粉絲團廣告", "舊客戶介紹", "門診轉介"];
const STAFFS = ["櫃臺-小美", "櫃臺-阿凱", "櫃臺-婉真"];
const NURSES = ["護理師-雅婷", "護理師-淑芬", "－"];

const rng = makeRng(1001);
const nextName = makeUniqueNameGenerator(rng, CURATED.map((c) => c.name));
const nextFamilyName = makeUniqueNameGenerator(rng);
const GENERATED: Customer[] = Array.from({ length: 47 }, (_, i) => {
  const id = i + 4;
  const signed = rng.bool(0.6);
  return {
    id,
    name: nextName(),
    level: rng.pick(LEVELS),
    parity: rng.pick(PARITY),
    phone: phoneNumber(rng),
    birthday: `19${rng.int(88, 99)}-${pad2(rng.int(1, 12))}-${pad2(rng.int(1, 28))}`,
    dueDate: addDays("2026-09-01", rng.int(-10, 60)),
    contractNo: signed ? `A1150${pad2(rng.int(1, 28))}${pad2(id)}` : undefined,
    signDate: signed ? addDays("2026-08-01", rng.int(0, 27)) : undefined,
    referrer: rng.pick(REFERRERS),
    mainStaff: rng.pick(STAFFS),
    mainNurse: rng.pick(NURSES),
    lineBound: rng.bool(0.6),
    family: rng.bool(0.7) ? `先生：${nextFamilyName()}` : "－",
  };
});

export const CUSTOMERS: Customer[] = [...CURATED, ...GENERATED];
