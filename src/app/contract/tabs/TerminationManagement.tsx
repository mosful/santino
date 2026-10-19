"use client";

import { useRef, useState } from "react";
import LegacyCaseScope from "@/components/cases/LegacyCaseScope";
import { caseActions } from "@/lib/demo/domainStore";
import type { CaseRecord } from "@/lib/domain/types";
import PrototypeFormActions from "@/components/ui/PrototypeFormActions";

export default function TerminationManagement() { return <LegacyCaseScope filter="signed">{(record) => <TerminationPanel key={record.id} record={record} />}</LegacyCaseScope>; }
function TerminationPanel({ record }: { record: CaseRecord }) {
  const [mode, setMode] = useState<"ratio" | "fixed">("ratio");
  const form = useRef<HTMLFormElement>(null);
  function save() { const values = new FormData(form.current!); const reason = String(values.get("reason") ?? ""); const amount = Number(values.get("refund")); if (!Number.isFinite(amount) || amount < 0) throw new Error("請確認退款示意金額。"); caseActions.note(record.id, `退約／作廢申請：${reason}；${mode === "ratio" ? "比例" : "固定手續費"}；退款示意 ${amount} 元。僅保存申請，未執行實際退款或退房。`); }

  return (
    <form ref={form} onSubmit={(event) => event.preventDefault()} className="space-y-4 text-sm">
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">
          退款計算規則設定（可設定，不寫死單一公式）
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={mode === "ratio"}
              onChange={() => setMode("ratio")}
            />
            依入住天數比例退費
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={mode === "fixed"}
              onChange={() => setMode("fixed")}
            />
            固定手續費
          </label>
          {mode === "fixed" && (
            <input placeholder="手續費金額" className="w-28 rounded border border-stone-200 px-2 py-1" />
          )}
        </div>
      </div>

      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">退約／作廢申請</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="mb-1 block text-stone-500">合約編號</label>
            <input aria-label="合約編號" value={record.contractNo} readOnly className="w-full rounded border border-stone-200 px-2 py-1.5" />
          </div>
          <div>
            <label className="mb-1 block text-stone-500">作廢／退約原因</label>
            <select name="reason" className="w-full rounded border border-stone-200 px-2 py-1.5">
              <option>客戶取消</option>
              <option>資料重複建立</option>
              <option>其他</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-stone-500">計算後退款金額</label>
            <input aria-label="退款示意金額" name="refund" type="number" defaultValue={record.deposit} placeholder="示意金額，需人工確認" className="w-full rounded border border-stone-200 px-2 py-1.5" />
          </div>
        </div>
        <p className="mt-2 text-xs text-stone-400">作廢需填寫原因並保留歷程，供稽核查詢。</p>
        <div className="mt-3">
          <PrototypeFormActions accent="rose" submitLabel="保存本案退約申請" onDraft={save} onSubmit={save} />
        </div>
      </div>
    </form>
  );
}
