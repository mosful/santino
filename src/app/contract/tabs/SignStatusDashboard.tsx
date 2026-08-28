import Card from "@/components/ui/Card";

const STATS = [
  { label: "已簽約未入住", value: 4, color: "text-sky-600" },
  { label: "已入住未簽約", value: 0, color: "text-emerald-600" },
  { label: "即將到期（30天內）", value: 1, color: "text-amber-600" },
  { label: "逾期未簽約", value: 0, color: "text-rose-600" },
];

export default function SignStatusDashboard() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {STATS.map((s) => (
        <Card key={s.label}>
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className="mt-1 text-xs text-slate-500">{s.label}</div>
        </Card>
      ))}
    </div>
  );
}
