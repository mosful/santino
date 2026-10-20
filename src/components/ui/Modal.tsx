"use client";

import { createPortal } from "react-dom";
import { buttonStyles } from "@/components/ui/buttonStyles";

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
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="animate-overlay-in fixed inset-0 z-[70] flex items-end justify-center sm:items-start sm:overflow-y-auto sm:p-4 sm:pt-10"
    >
      <button type="button" className="absolute inset-0 min-h-0 w-full bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="關閉對話框" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={
          "animate-modal-pop safe-bottom relative flex max-h-[92vh] w-full flex-col overscroll-contain rounded-t-2xl bg-surface-raised shadow-2xl sm:max-h-[85vh] sm:rounded-2xl " +
          (wide ? "sm:max-w-4xl" : "sm:max-w-xl")
        }
      >
        <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-3.5">
          <h2 id="modal-title" className="truncate pr-2 text-sm font-bold text-stone-800">{title}</h2>
          <button
            onClick={onClose}
            className={buttonStyles({ variant: "ghost", size: "sm", iconOnly: true, className: "rounded-full" })}
            aria-label="關閉"
          >
            ✕
          </button>
        </div>
        <div className="scroll-fade overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
