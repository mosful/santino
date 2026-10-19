"use client";

import Link from "next/link";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Badge from "@/components/ui/Badge";
import { type Contract } from "@/lib/mock/contract";
import { useContractRows } from "@/lib/domain/legacySelectors";

const columns: Column<Contract & { caseId: string }>[] = [
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
  {
    key: "id",
    label: "操作",
    render: (record) => (
      <div className="flex gap-2 whitespace-nowrap text-xs">
        <Link href={`/cases/detail/?id=${encodeURIComponent(record.caseId)}`} className="text-rose-500 underline">
          變更
        </Link>
        <Link href={`/contract/?tab=termination&case=${encodeURIComponent(record.caseId)}`} className="text-stone-400 underline">
          退約/作廢
        </Link>
      </div>
    ),
  },
];

export default function ContractList() {
  const CONTRACTS = useContractRows();
  const totalDeposit = CONTRACTS.reduce((s, c) => s + c.deposit, 0);
  return (
    <div className="space-y-3">
      <div className="rounded bg-stone-50 p-2 text-xs text-stone-500">
        共用案件共{CONTRACTS.length}筆合約；有效合約{CONTRACTS.length}筆；作廢合約0筆；已付訂金{CONTRACTS.length}筆；訂金總額${totalDeposit.toLocaleString()}
      </div>
      <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
        ⚠ 合約金額一經簽約即鎖定，不提供直接編輯/刪除；異動請走「合約變更單」（留存異動log），
        作廢/退約請走「退約／作廢管理」，新增請至「新增合約」頁籤（見訪談整理v1.md規則）。
      </p>
      <QueryList columns={columns} rows={CONTRACTS} searchPlaceholder="合約編號/姓名/手機/證號" />
    </div>
  );
}
