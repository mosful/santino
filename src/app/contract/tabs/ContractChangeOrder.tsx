"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import LegacyCaseScope from "@/components/cases/LegacyCaseScope";
import { caseActions } from "@/lib/demo/domainStore";
import type { CaseRecord } from "@/lib/domain/types";
import { buttonStyles } from "@/components/ui/buttonStyles";

export default function ContractChangeOrder() { return <LegacyCaseScope filter="signed">{(record) => <ChangePanel key={record.id} record={record} />}</LegacyCaseScope>; }
function ChangePanel({ record }: { record: CaseRecord }) {
  const logs = record.ledger.filter((entry) => entry.before !== undefined).map((entry) => ({ id: entry.id, contractNo: record.contractNo, reason: entry.label, operator: entry.actor ?? "歷史展示資料", time: new Date(entry.at ?? `${entry.date}T00:00:00+08:00`).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }), before: entry.before ?? 0, after: entry.after ?? 0 }));
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState("");
  const [reason, setReason] = useState("房型變更");
  const before = (record.overrideAmount ?? record.quotedAmount) + record.ledger.filter((entry) => /^(合約變更|合約金額調整)/.test(entry.label)).reduce((sum, entry) => sum + entry.amount, 0);
  const [after, setAfter] = useState(before);

  function submit() { try { if (!detail.trim()) throw new Error("請填寫變更詳細原因。"); caseActions.contractAmount(record.id, after, `${reason}；${detail}`); setMessage("已保存共用變更單，原合約快照保留。"); } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); } }
  return (
    <div className="space-y-4 text-sm">{message && <p role="status">{message}</p>}
      <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
        ⚠ 開放對象：僅主管／櫃臺Leader層級帳號可直接修改（原舊系統此類修改被廠商鎖權限）。
      </div>
      <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
        ⚠ 原則：今天之前的帳務已鎖定不可修改；急診等特殊情況需選擇「急診例外」並填寫原因，
        系統會額外標記此筆為例外修改，供事後稽核追蹤（見訪談整理v2 §3.5）。
      </div>
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">新增變更單</div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="mb-1 block text-stone-500">變更原因（選單化，非手動輸入）</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded border border-stone-200 px-2 py-1.5">
              <option>房型變更</option>
              <option>天數增</option>
              <option>天數減</option>
              <option>急診例外（今天之前帳務修正）</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-stone-500">改前金額</label>
            <input
              type="number"
              value={before}
              readOnly
              className="w-full rounded border border-stone-200 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-stone-500">改後金額</label>
            <input
              type="number"
              value={after}
              onChange={(e) => setAfter(Number(e.target.value))}
              className="w-full rounded border border-stone-200 px-2 py-1.5"
            />
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <label className="mb-3 block text-xs">變更詳細原因<input aria-label="變更詳細原因" value={detail} onChange={(event) => setDetail(event.target.value)} className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5" /></label>
          <button onClick={submit} className={buttonStyles({ variant: "danger", size: "sm" })}>
            確認變更（自動留log）
          </button>
        </div>
      </div>

      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">變更歷程 Log（誰改的／何時／改前改後金額）</div>
        <table className="w-full text-left text-xs">
          <thead className="text-stone-500">
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
              <tr key={l.id} className="border-t border-stone-100">
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

      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">每日自費加值項目明細</div>
        <p className="text-xs text-stone-400">
          中醫／洗頭／按摩／額外課程等，以每日明細方式記錄加成金額，方便日後對帳。
        </p>
      </div>
    </div>
  );
}
