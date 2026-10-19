"use client";
import { useDomainStore } from "@/lib/demo/domainStore";
import Card from "@/components/ui/Card";

export default function SignStatusDashboard() {
  const { data } = useDomainStore(); const today = data.demoAt.slice(0, 10);
  const STATS = [
    { label: "已簽約未入住", value: data.cases.filter((item) => item.signed && !item.actualAdmission && !item.closed).length, color: "text-sky-600" },
    { label: "已入住未簽約", value: data.cases.filter((item) => item.actualAdmission && !item.signed && !item.dischargedAt).length, color: "text-emerald-600" },
    { label: "即將到期（30天內）", value: data.cases.filter((item) => item.actualAdmission && !item.dischargedAt && Date.parse(item.actualAdmission) + item.days * 86400000 - Date.parse(today) <= 30 * 86400000).length, color: "text-amber-600" },
    { label: "逾期未簽約", value: data.cases.filter((item) => item.stage === 3 && !item.signed && item.signedDate && item.signedDate < today && !item.closed).length, color: "text-rose-600" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {STATS.map((s) => (
        <Card key={s.label}>
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className="mt-1 text-xs text-stone-500">{s.label}</div>
        </Card>
      ))}
    </div>
  );
}
