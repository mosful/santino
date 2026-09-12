"use client";

import { useMemo, useState } from "react";
import PrototypeFormActions from "@/components/ui/PrototypeFormActions";

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-stone-500">{label}</label>
      <input placeholder={placeholder} className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm" />
    </div>
  );
}

export default function ChildcareContract() {
  const [days, setDays] = useState(3);
  const [dailyFee, setDailyFee] = useState(3200);
  const total = useMemo(() => Math.max(0, days) * Math.max(0, dailyFee), [days, dailyFee]);

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
        媽媽原住房合約於退宿日結束；寶寶留房需另立托嬰合約。托嬰案件沒有房號時，以家長車號作為主要辨識資訊。
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="媽媽姓名" placeholder="劉○安" />
        <Field label="原住房合約編號" placeholder="A115082801" />
        <Field label="媽媽退宿日" placeholder="2026-09-10" />
        <Field label="寶寶姓名／病歷號" placeholder="劉寶寶／B20260901" />
        <Field label="家長車號（無房號案件識別）" placeholder="ABC-1234" />
        <Field label="留房原因" placeholder="黃疸追蹤／家庭安排" />
        <Field label="托嬰開始日" placeholder="2026-09-10" />
        <Field label="預計接回日" placeholder="2026-09-13" />
        <Field label="授權接回人" placeholder="媽媽／爸爸／指定家屬" />
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

      <PrototypeFormActions accent="teal" submitLabel="建立托嬰合約" />
    </div>
  );
}
