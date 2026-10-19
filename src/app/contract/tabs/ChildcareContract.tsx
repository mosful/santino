"use client";

import { useMemo, useRef, useState } from "react";
import LegacyCaseScope from "@/components/cases/LegacyCaseScope";
import { caseActions, useDomainStore } from "@/lib/demo/domainStore";
import type { CaseRecord } from "@/lib/domain/types";
import PrototypeFormActions from "@/components/ui/PrototypeFormActions";

function Field({ label, placeholder, value, editable = false }: { label: string; placeholder?: string; value?: string; editable?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-stone-500">{label}</label>
      <input aria-label={label} name={label} defaultValue={value} readOnly={!editable} placeholder={placeholder} className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm" />
    </div>
  );
}

export default function ChildcareContract() { return <LegacyCaseScope filter="signed">{(record) => <ChildcarePanel key={record.id} record={record} />}</LegacyCaseScope>; }
function ChildcarePanel({ record }: { record: CaseRecord }) {
  const form = useRef<HTMLFormElement>(null); const { data } = useDomainStore();
  const [days, setDays] = useState(record.childcareDays);
  const [dailyFee, setDailyFee] = useState(record.childcareFee);
  function save() { const values = new FormData(form.current!); if (record.closed && record.childcare && !record.childcareEnded) { caseActions.updateChildcare(record.id, String(values.get("家長車號（無房號案件識別）") ?? ""), days, dailyFee, String(values.get("授權接回人") ?? ""), String(values.get("留房原因") ?? "")); return; } caseActions.update(record.id, { childcare: true, childcareDays: days, childcareFee: dailyFee, childcareCar: String(values.get("家長車號（無房號案件識別）") ?? ""), childcareContact: String(values.get("授權接回人") ?? ""), note: String(values.get("留房原因") ?? "") }); caseActions.note(record.id, "已保存托嬰合約條件；實際媽媽退房請於案件完成結算與返家檢查。"); }
  const total = useMemo(() => Math.max(0, days) * Math.max(0, dailyFee), [days, dailyFee]);

  return (
    <form ref={form} onSubmit={(event) => event.preventDefault()} className="space-y-4 text-sm">
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
        媽媽原住房合約於退宿日結束；寶寶留房需另立托嬰合約。托嬰案件沒有房號時，以家長車號作為主要辨識資訊。
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="媽媽姓名" value={record.name} />
        <Field label="原住房合約編號" value={record.contractNo} />
        <Field label="媽媽退宿日" value={record.dischargedAt.slice(0, 10) || "尚未退房"} />
        <Field label="寶寶姓名／病歷號" value={data.subjects.filter((subject) => subject.caseId === record.id && subject.kind === "baby").map((subject) => `${subject.name}／${subject.chartNo}`).join("、")} />
        <Field label="家長車號（無房號案件識別）" value={record.childcareCar} editable />
        <Field label="留房原因" value={record.note} editable />
        <Field label="托嬰開始日" value={record.dischargedAt.slice(0, 10) || "依實際退房日"} />
        <Field label="預計接回日" value={record.dischargedAt ? new Date(Date.parse(record.dischargedAt) + days * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }) : "依實際退房日＋托嬰天數"} />
        <Field label="授權接回人" value={record.childcareContact} editable />
      </div>

      <div className="rounded-xl border border-stone-200 p-3">
        <div className="mb-3 text-xs font-medium text-stone-600">托嬰費用試算</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-stone-500">托嬰天數<input type="number" min={1} value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm" /></label>
          <label className="text-xs text-stone-500">每日費用<input type="number" min={0} value={dailyFee} onChange={(event) => setDailyFee(Number(event.target.value))} className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm" /></label>
          <div className="rounded-lg bg-stone-50 p-3"><div className="text-xs text-stone-400">預估總額</div><div className="mt-1 text-xl font-bold text-teal-700">NT$ {total.toLocaleString("zh-TW")}</div></div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-stone-500">照護授權與接回備註</label>
        <textarea className="h-20 w-full rounded border border-stone-200 p-2 text-sm" placeholder="記錄餵食方式、醫療追蹤、接回驗證與緊急聯絡安排" />
      </div>

      <PrototypeFormActions accent="teal" submitLabel="儲存本案托嬰條件" onDraft={save} onSubmit={save} />
    </form>
  );
}
