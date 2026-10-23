"use client";

import { useMemo, useRef, useState } from "react";
import LegacyCaseScope from "@/components/cases/LegacyCaseScope";
import { caseActions, useDomainStore } from "@/lib/demo/domainStore";
import type { CaseRecord } from "@/lib/domain/types";
import { FormSection, ResultCard, SummaryRow, WorkArea } from "@/components/ui/Workspace";
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

  const returnDate = record.dischargedAt ? new Date(Date.parse(record.dischargedAt) + days * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }) : "依實際退房日＋托嬰天數";
  return (
    <form ref={form} onSubmit={(event) => event.preventDefault()} className="space-y-5 text-sm">
      <p className="text-sm leading-6 text-stone-600">媽媽原住房合約於退房日結束；寶寶續留需另立托嬰合約。無房號時以家長車號識別，原住房號保留供回溯。</p>
      <WorkArea aside={<>
        <ResultCard title="托嬰預估總額" value={`NT$ ${total.toLocaleString("zh-TW")}`} description={`${days} 天・每日 NT$ ${dailyFee.toLocaleString("zh-TW")}`}>
          <SummaryRow label="媽媽退房日" value={record.dischargedAt.slice(0, 10) || "尚未退房"} />
          <SummaryRow label="預計接回日" value={returnDate} />
          <SummaryRow label="原住房號" value={record.room || "未登錄"} muted />
        </ResultCard>
        <PrototypeFormActions accent="teal" submitLabel="儲存本案托嬰條件" onDraft={save} onSubmit={save} />
      </>}>
        <FormSection title="媽媽與寶寶資料" description="沿用同一案件資料，核對後填寫接回安排。">
          <div className="form-grid">
            <Field label="媽媽姓名" value={record.name} />
            <Field label="原住房合約編號" value={record.contractNo} />
            <Field label="寶寶姓名／病歷號" value={data.subjects.filter((subject) => subject.caseId === record.id && subject.kind === "baby").map((subject) => `${subject.name}／${subject.chartNo}`).join("、")} />
            <Field label="媽媽原住房號" value={record.room || "未登錄"} />
          </div>
        </FormSection>
        <FormSection title="托嬰與接回安排">
          <div className="form-grid">
            <Field label="家長車號（無房號案件識別）" value={record.childcareCar} editable />
            <Field label="授權接回人" value={record.childcareContact} editable />
            <Field label="托嬰開始日" value={record.dischargedAt.slice(0, 10) || "依實際退房日"} />
            <Field label="留房原因" value={record.note} editable />
          </div>
          <div className="form-grid">
            <label className="block space-y-2 text-sm">托嬰天數<input aria-label="托嬰天數" type="number" min={1} value={days} onChange={(event) => setDays(Number(event.target.value))} className="w-full rounded-lg border border-stone-300 px-3 py-2" /></label>
            <label className="block space-y-2 text-sm">每日費用<input aria-label="每日費用" type="number" min={0} value={dailyFee} onChange={(event) => setDailyFee(Number(event.target.value))} className="w-full rounded-lg border border-stone-300 px-3 py-2" /></label>
          </div>
          <label className="block space-y-2 text-sm">照護授權與接回備註<textarea className="w-full rounded-lg border border-stone-300 p-3" placeholder="記錄餵食方式、醫療追蹤、接回驗證與緊急聯絡安排" /></label>
        </FormSection>
      </WorkArea>
    </form>
  );
}
