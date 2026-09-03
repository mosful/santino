"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GripVertical, Minus, X } from "lucide-react";

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

/**
 * 初始寬度：作業視窗要放得下整排作業頁籤與兩欄式表單，故取較寬的值，
 * 目的是讓內容不必左右／上下捲動；但仍夾在視埠內（iPad／手機直向）。
 */
function initialWidth(wide: boolean) {
  const base = wide ? 1280 : 440;
  if (typeof window === "undefined") return base;
  return Math.min(base, Math.max(MIN_WIDTH, window.innerWidth - 48));
}

export default function FloatingWindow({
  title,
  onClose,
  onFocus,
  onMinimize,
  zIndex,
  initialPos,
  wide = false,
  hidden = false,
  children,
}: {
  title: string;
  onClose: () => void;
  onFocus: () => void;
  onMinimize?: () => void;
  zIndex: number;
  initialPos: { x: number; y: number };
  wide?: boolean;
  /** 縮小到底部工作列時以 display:none 隱藏而非卸載，保留位置／尺寸／表單輸入內容 */
  hidden?: boolean;
  children: React.ReactNode;
}) {
  const [size, setSize] = useState<{ width: number; height: number | null }>(() => ({
    width: initialWidth(wide),
    height: null,
  }));
  // 起始座標同樣夾在視埠內，避免窄螢幕開窗時整個視窗被推到畫面外
  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return initialPos;
    const maxX = Math.max(8, window.innerWidth - initialWidth(wide) - 12);
    return { x: Math.min(initialPos.x, maxX), y: initialPos.y };
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

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

  function handleResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    onFocus();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: size.width,
      origH: size.height ?? bodyRef.current?.getBoundingClientRect().height ?? 400,
    };
  }

  function handleResizePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const maxW = window.innerWidth - pos.x - 16;
    const maxH = window.innerHeight - pos.y - 16;
    setSize({
      width: Math.min(Math.max(MIN_WIDTH, resizeRef.current.origW + dx), maxW),
      height: Math.min(Math.max(MIN_HEIGHT, resizeRef.current.origH + dy), maxH),
    });
  }

  function handleResizePointerUp() {
    resizeRef.current = null;
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      onPointerDown={onFocus}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex,
        width: size.width,
        height: size.height ?? undefined,
        // 可用高度依視窗實際位置計算（而非固定 vh），既保證底部不超出畫面，
        // 視窗越靠上時也能用到越多高度，減少長表單出現垂直捲軸
        maxHeight: `calc(100vh - ${pos.y}px - 16px)`,
        display: hidden ? "none" : undefined,
      }}
      className="animate-modal-pop flex flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl"
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
        <span className="flex shrink-0 items-center gap-1">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20"
              aria-label="縮小"
              title="縮小到頁面下方"
            >
              <Minus className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20" aria-label="關閉">
            <X className="h-4 w-4" />
          </button>
        </span>
      </div>
      <div ref={bodyRef} className="scroll-fade min-h-0 flex-1 overflow-y-auto p-4">
        {children}
      </div>

      <div
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerLeave={handleResizePointerUp}
        className="absolute bottom-0 right-0 flex h-5 w-5 touch-none items-end justify-end rounded-tl bg-transparent"
        style={{ cursor: "nwse-resize" }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 10 10" className="mb-0.5 mr-0.5 h-2.5 w-2.5 text-stone-300">
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    </div>,
    document.body
  );
}
