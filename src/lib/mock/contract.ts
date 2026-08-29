import { makeRng, maskedName, addDays, pad2 } from "./genUtil";

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

const CURATED: Contract[] = [
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

const SIGNERS = ["本人", "先生代簽", "媽媽代簽"];
const STATUSES: Contract["status"][] = ["已簽約", "已簽約", "已簽約", "已簽約", "草稿", "已作廢"];
const DAILY_RATE = [6800, 7800, 9800, 15800];

const rng = makeRng(5005);
const GENERATED: Contract[] = Array.from({ length: 48 }, (_, i) => {
  const id = i + 3;
  const scheduledDays = rng.pick([15, 21, 24, 30]);
  const rate = rng.pick(DAILY_RATE);
  const signDate = addDays("2026-07-01", rng.int(0, 58));
  const admission = addDays(signDate, rng.int(5, 40));
  return {
    id,
    contractNo: `A1150${pad2(rng.int(1, 28))}${pad2(id)}`,
    motherName: maskedName(rng),
    dueDate: addDays(admission, rng.int(-5, 20)),
    scheduledAdmission: admission,
    scheduledDays,
    totalAmount: rate * scheduledDays,
    signDate,
    signer: rng.pick(SIGNERS),
    status: rng.pick(STATUSES),
    deposit: rng.pick([10000, 20000, 30000]),
  };
});

export const CONTRACTS: Contract[] = [...CURATED, ...GENERATED];
