"use client";

import { useRef, useState } from "react";

/** 頁內簽名板；座標依實際顯示尺寸換算，桌面與觸控平板共用。 */
export default function CareSignature({ identity, onConfirm, onCancel }: { identity: string; onConfirm: (image: string) => void; onCancel: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [ink, setInk] = useState(false);
  function position(event: React.PointerEvent<HTMLCanvasElement>) {
    const target = canvas.current!;
    const rect = target.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * target.width / rect.width, y: (event.clientY - rect.top) * target.height / rect.height };
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const target = canvas.current!;
    const context = target.getContext("2d")!;
    const point = position(event);
    target.setPointerCapture(event.pointerId); drawing.current = true;
    context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(point.x + 0.1, point.y + 0.1);
    context.strokeStyle = "#292524"; context.lineWidth = 3; context.lineCap = "round"; context.stroke(); setInk(true);
  }
  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const point = position(event); const context = canvas.current!.getContext("2d")!;
    context.lineTo(point.x, point.y); context.stroke();
  }
  return <section className="space-y-3 rounded-xl border border-stone-300 bg-stone-50 p-4" aria-label="頁內簽名">
    <p className="text-sm font-medium">請確認簽名對象：{identity}</p>
    <p className="text-xs text-stone-600">此簽名只屬於目前個案與本筆表單，不會帶到其他住民。</p>
    <canvas ref={canvas} width={800} height={240} onPointerDown={start} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} className="h-40 w-full touch-none rounded-lg border border-dashed border-stone-400 bg-white" aria-label="手寫簽名區" />
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => { canvas.current!.getContext("2d")!.clearRect(0, 0, 800, 240); setInk(false); }} className="min-h-12 rounded-lg border border-stone-300 px-4">清除</button>
      <button type="button" onClick={onCancel} className="min-h-12 rounded-lg border border-stone-300 px-4">取消簽名</button>
      <button type="button" disabled={!ink} onClick={() => onConfirm(canvas.current!.toDataURL("image/png"))} className="min-h-12 rounded-lg bg-brand-600 px-4 text-white disabled:opacity-40">確認本筆簽名</button>
    </div>
  </section>;
}
