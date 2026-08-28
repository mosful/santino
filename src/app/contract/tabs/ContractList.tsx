"use client";

import QueryList, { type Column } from "@/components/ui/QueryList";
import Badge from "@/components/ui/Badge";
import { CONTRACTS, type Contract } from "@/lib/mock/contract";

const columns: Column<Contract>[] = [
  { key: "contractNo", label: "合約編號" },
  { key: "motherName", label: "媽媽姓名" },
  { key: "dueDate", label: "預產日" },
  { key: "scheduledAdmission", label: "預定入住日" },
  { key: "scheduledDays", label: "預定天數" },
  { key: "totalAmount", label: "總金額", render: (r) => `$${r.totalAmount.toLocaleString()}` },
  { key: "signDate", label: "簽約日期" },
  { key: "signer", label: "簽署人" },
  {
    key: "status",
    label: "合約狀態",
    render: (r) => <Badge color={r.status === "已簽約" ? "green" : r.status === "草稿" ? "slate" : "rose"}>{r.status}</Badge>,
  },
  { key: "deposit", label: "訂金", render: (r) => `$${r.deposit.toLocaleString()}` },
];

export default function ContractList() {
  const totalDeposit = CONTRACTS.reduce((s, c) => s + c.deposit, 0);
  return (
    <div className="space-y-3">
      <div className="rounded bg-stone-50 p-2 text-xs text-stone-500">
        2026-08-01~08-28 共{CONTRACTS.length}筆合約；有效合約{CONTRACTS.length}筆；作廢合約0筆；已付訂金{CONTRACTS.length}筆；訂金總額${totalDeposit.toLocaleString()}
      </div>
      <QueryList columns={columns} rows={CONTRACTS} searchPlaceholder="合約編號/姓名/手機/證號" />
    </div>
  );
}
