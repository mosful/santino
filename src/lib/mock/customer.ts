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

export const CUSTOMERS: Customer[] = [
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
