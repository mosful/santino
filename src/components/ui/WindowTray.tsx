"use client";

import { createPortal } from "react-dom";
import { X, Layers, Minimize2 } from "lucide-react";

export type WindowTrayItem = {
  id: string;
  label: string;
  minimized: boolean;
};

export default function WindowTray({
  items,
  onToggle,
  onClose,
  onMinimizeAll,
  onCloseAll,
}: {
  items: WindowTrayItem[];
  onToggle: (id: string) => void;
  onClose: (id: string) => void;
  onMinimizeAll: () => void;
  onCloseAll: () => void;
}) {
  if (items.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[55] flex items-center gap-2 border-t border-stone-200 bg-white/95 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur">
      <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-400 sm:flex">
        <Layers className="h-3.5 w-3.5" />
        開啟中 {items.length}
      </span>

      <div className="scroll-fade flex flex-1 gap-1.5 overflow-x-auto">
        {items.map((it) => (
          <div
            key={it.id}
            className={
              "flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors " +
              (it.minimized
                ? "border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100"
                : "border-brand-300 bg-brand-50 text-brand-700")
            }
          >
            <button onClick={() => onToggle(it.id)} className="max-w-[160px] truncate font-medium">
              {it.label}
            </button>
            <button
              onClick={() => onClose(it.id)}
              aria-label={`關閉${it.label}`}
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={onMinimizeAll}
          className="flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-200"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          全部縮小
        </button>
        <button
          onClick={onCloseAll}
          className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-100"
        >
          <X className="h-3.5 w-3.5" />
          全部關閉
        </button>
      </div>
    </div>,
    document.body
  );
}
