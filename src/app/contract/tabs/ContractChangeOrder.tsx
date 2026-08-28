"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";

type ChangeLog = {
  id: number;
  contractNo: string;
  reason: string;
  operator: string;
  time: string;
  before: number;
  after: number;
};

const LOGS: ChangeLog[] = [
  { id: 1, contractNo: "A115082801", reason: "天數增", operator: "Leader-阿凱", time: "2026-08-20 14:03", before: 168000, after: 176000 },
];

export default function ContractChangeOrder() {
  const [logs, setLogs] = useState(LOGS);
  const [reason, setReason] = useState("房型變更");
  const [before, setBefore] = useState(168000);
  const [after, setAfter] = useState(168000);

  function submit() {
    setLogs((ls) => [
      {
        id: ls.length + 1,
        contractNo: "A115082801",
        reason,
        operator: "Leader-阿凱（示意，實際依登入者帶入）",
        time: new Date().toISOString().slice(0, 16).replace("T", " "),
        before,
        after,
      },
      ...ls,
    ]);
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
        ⚠ 開放對象：僅主管／櫃臺Leader層級帳號可直接修改（原舊系統此類修改被廠商鎖權限）。
      </div>
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">新增變更單</div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="mb-1 block text-slate-500">變更原因（選單化，非手動輸入）</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5">
              <option>房型變更</option>
              <option>天數增</option>
              <option>天數減</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-slate-500">改前金額</label>
            <input
              type="number"
              value={before}
              onChange={(e) => setBefore(Number(e.target.value))}
              className="w-full rounded border border-slate-200 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-slate-500">改後金額</label>
            <input
              type="number"
              value={after}
              onChange={(e) => setAfter(Number(e.target.value))}
              className="w-full rounded border border-slate-200 px-2 py-1.5"
            />
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <button onClick={submit} className="rounded bg-rose-500 px-3 py-1.5 text-xs text-white">
            確認變更（自動留log）
          </button>
        </div>
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">變更歷程 Log（誰改的／何時／改前改後金額）</div>
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="px-2 py-1">合約編號</th>
              <th className="px-2 py-1">變更原因</th>
              <th className="px-2 py-1">操作人</th>
              <th className="px-2 py-1">時間</th>
              <th className="px-2 py-1">改前</th>
              <th className="px-2 py-1">改後</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-2 py-1.5">{l.contractNo}</td>
                <td className="px-2 py-1.5">
                  <Badge color="amber">{l.reason}</Badge>
                </td>
                <td className="px-2 py-1.5">{l.operator}</td>
                <td className="px-2 py-1.5">{l.time}</td>
                <td className="px-2 py-1.5">${l.before.toLocaleString()}</td>
                <td className="px-2 py-1.5">${l.after.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">每日自費加值項目明細</div>
        <p className="text-xs text-slate-400">
          中醫／洗頭／按摩／額外課程等，以每日明細方式記錄加成金額，方便日後對帳。
        </p>
      </div>
    </div>
  );
}
