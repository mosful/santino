export default function Card({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="work-surface min-w-0 p-4 sm:p-5">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm font-semibold text-stone-700">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
