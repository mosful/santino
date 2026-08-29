"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GripVertical, X } from "lucide-react";

export default function FloatingWindow({
  title,
  onClose,
  onFocus,
  zIndex,
  initialPos,
  wide = false,
  children,
}: {
  title: string;
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  initialPos: { x: number; y: number };
  wide?: boolean;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState(initialPos);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    onFocus();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 60;
    setPos({
      x: Math.min(Math.max(0, dragRef.current.origX + dx), maxX),
      y: Math.min(Math.max(0, dragRef.current.origY + dy), maxY),
    });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      onPointerDown={onFocus}
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex }}
      className={"animate-modal-pop flex max-h-[85vh] w-[92vw] flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl " + (wide ? "sm:w-[640px]" : "sm:w-[440px]")}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex shrink-0 cursor-move touch-none items-center justify-between rounded-t-2xl bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2.5 text-white"
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-bold">
          <GripVertical className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{title}</span>
        </span>
        <button onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/20" aria-label="關閉">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="scroll-fade overflow-y-auto p-4">{children}</div>
    </div>,
    document.body
  );
}
