"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";

type RenewalCandidate = {
  id: number;
  contractNo: string;
  motherName: string;
  expireDate: string;
  daysLeft: number;
};

const CANDIDATES: RenewalCandidate[] = [
  { id: 1, contractNo: "A115082801", motherName: "邱o乾", expireDate: "2026-09-30", daysLeft: 12 },
];

export default function RenewalManagement() {
  const [thresholdDays, setThresholdDays] = useState(30);

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
                <button className="rounded bg-rose-500 px-2 py-1 text-xs text-white">
                  產生續約合約
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-stone-400">產生續約合約時自動計算續約價格（依當時牌價與優惠規則）。</p>
    </div>
  );
}
