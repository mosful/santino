import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  gradient: string;
  href?: string;
}) {
  const content = (
    <>
      <div
        className={
          "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 blur-xl transition-opacity duration-300 group-hover:opacity-20 " +
          gradient
        }
      />
      <div className="relative flex items-center gap-3">
        <span className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm " + gradient}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-2xl font-bold text-stone-800">{value}</div>
          <div className="truncate text-xs text-stone-400">{label}</div>
        </div>
      </div>
    </>
  );

  const className =
    "group relative block overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg" +
    (href ? " cursor-pointer" : "");

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
