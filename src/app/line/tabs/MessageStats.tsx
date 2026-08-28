import Card from "@/components/ui/Card";

const STATS = [
  { label: "本月發送量", value: "1,248則", color: "text-stone-800" },
  { label: "送達率", value: "99.2%", color: "text-emerald-600" },
  { label: "已讀率", value: "76.4%", color: "text-sky-600" },
  { label: "連結點擊率", value: "18.9%", color: "text-amber-600" },
];

export default function MessageStats() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-xs text-stone-500">{s.label}</div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-stone-400">
        所有發送皆計入LINE官方帳號月配額（依方案：免費/輕用量/中用量/高用量），需納入配額使用量監控，避免超額產生費用或發送失敗。
      </p>
    </div>
  );
}
