export default function Badge({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: "slate" | "rose" | "green" | "amber" | "blue" | "purple";
}) {
  const colorMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    rose: "bg-rose-100 text-rose-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-sky-100 text-sky-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span
      className={
        "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium " +
        colorMap[color]
      }
    >
      {children}
    </span>
  );
}
