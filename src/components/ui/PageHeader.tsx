export default function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 border-b border-amber-900/10 pb-3">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-rose-400 to-amber-400" />
        <h1 className="text-lg font-bold text-stone-800">{title}</h1>
      </div>
      {action}
    </div>
  );
}
