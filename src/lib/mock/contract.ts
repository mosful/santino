export type Contract = {
  id: number;
  contractNo: string;
  motherName: string;
  dueDate: string;
  scheduledAdmission: string;
  scheduledDays: number;
  totalAmount: number;
  signDate: string;
  signer: string;
  status: "已簽約" | "草稿" | "已作廢";
  deposit: number;
};

export const CONTRACTS: Contract[] = [
  {
    id: 1,
    contractNo: "A115082801",
    motherName: "邱o乾",
    dueDate: "2026-09-15",
    scheduledAdmission: "2026-09-10",
    scheduledDays: 21,
    totalAmount: 168000,
    signDate: "2026-08-01",
    signer: "本人",
    status: "已簽約",
    deposit: 20000,
  },
  {
    id: 2,
    contractNo: "A115082802",
    motherName: "林o臻",
    dueDate: "2026-09-28",
    scheduledAdmission: "2026-09-25",
    scheduledDays: 30,
    totalAmount: 294000,
    signDate: "2026-08-15",
    signer: "先生代簽",
    status: "已簽約",
    deposit: 30000,
  },
];
