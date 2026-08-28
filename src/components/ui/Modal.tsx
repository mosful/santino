"use client";

export default function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-start sm:overflow-y-auto sm:p-4 sm:pt-10"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          "safe-bottom flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[85vh] sm:rounded-2xl " +
          (wide ? "sm:max-w-4xl" : "sm:max-w-xl")
        }
      >
        <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-3.5">
          <h2 className="truncate pr-2 text-sm font-bold text-stone-800">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 active:bg-stone-200"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>
        <div className="scroll-fade overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
