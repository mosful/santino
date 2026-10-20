"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { useDomainStore } from "@/lib/demo/domainStore";
import { buttonStyles } from "@/components/ui/buttonStyles";

export default function RenewalManagement() {
  const [thresholdDays, setThresholdDays] = useState(30);
  const { data } = useDomainStore();
  const CANDIDATES = data.cases.filter((record) => record.actualAdmission && !record.dischargedAt).map((record) => { const end = Date.parse(`${record.actualAdmission}T00:00:00+08:00`) + record.days * 86_400_000; return { id: record.id, contractNo: record.contractNo, motherName: record.name, expireDate: new Date(end).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }), daysLeft: Math.ceil((end - Date.parse(data.demoAt)) / 86_400_000) }; });

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">參數設定</div>
        <label className="flex items-center gap-2 text-xs">
          合約到期前
          <input
            type="number"
            value={thresholdDays}
            onChange={(e) => setThresholdDays(Number(e.target.value))}
            className="w-16 rounded border border-stone-200 px-2 py-1"
          />
          天，開始提示續約
        </label>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-500">
          <tr>
            <th className="px-3 py-2">合約編號</th>
            <th className="px-3 py-2">媽媽姓名</th>
            <th className="px-3 py-2">到期日</th>
            <th className="px-3 py-2">剩餘天數</th>
            <th className="px-3 py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {CANDIDATES.filter((c) => c.daysLeft <= thresholdDays).map((c) => (
            <tr key={c.id} className="border-t border-stone-100">
              <td className="px-3 py-2">{c.contractNo}</td>
              <td className="px-3 py-2">{c.motherName}</td>
              <td className="px-3 py-2">{c.expireDate}</td>
              <td className="px-3 py-2">
                <Badge color={c.daysLeft <= 7 ? "rose" : "amber"}>{c.daysLeft}天</Badge>
              </td>
              <td className="px-3 py-2">
                <Link href={`/cases/detail/?id=${encodeURIComponent(c.id)}`} className={buttonStyles({ variant: "danger", size: "sm" })}>
                  辦理續住變更單
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-stone-400">辦理續住變更單時自動計算續約價格（依當時牌價與優惠規則）。</p>
    </div>
  );
}
