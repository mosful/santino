import { MODULE_ICONS } from "@/components/layout/icons";
import { pageTitle } from "@/lib/usePageTitle";

export default function PageHeader({
  title,
  action,
  moduleNo,
}: {
  title: string;
  action?: React.ReactNode;
  moduleNo?: string;
}) {
  const Icon = moduleNo ? MODULE_ICONS[moduleNo] : undefined;
  return (
    <div className="animate-fade-in-up mb-5 flex items-center justify-between gap-3 border-b border-brand-900/10 pb-3">
      <title>{pageTitle(title)}</title>
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-400 text-white shadow-sm shadow-brand-200">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : (
          <span className="h-6 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-brand-400 to-accent-400" />
        )}
        <h1 className="text-lg font-bold text-stone-800">{title}</h1>
      </div>
      {action}
    </div>
  );
}
