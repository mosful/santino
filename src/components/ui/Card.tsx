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
    <section className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-[0_10px_28px_rgba(var(--shadow-color),0.07)] transition-[transform,box-shadow,border-color] duration-200 hover:border-brand-200 hover:shadow-[0_14px_34px_rgba(var(--shadow-color),0.11)]">
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
