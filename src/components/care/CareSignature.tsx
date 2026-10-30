"use client";

import { useRef, useState } from "react";
import { PenLine, Stamp } from "lucide-react";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { useSignature, rememberSignature, type SignatureRecord } from "@/lib/signatureStore";
import { taipeiTimestamp } from "@/lib/care/rules";

/*
  頁內簽名板。照護三種角色、案件經辦人員、合約媽媽本人都用這一支。

  ⚠️ 尺寸是給 iPad 用手指或電子筆簽的（客戶 2026-10-30）：畫布 1200×420、顯示高度
  在觸控裝置拉到 18rem。手指的接觸面比滑鼠游標大得多，框太小會寫不開、一筆就滿版，
  簽出來的字跟本人平常的簽名差很遠。筆畫寬度也跟著畫布放大，縮圖才不會變成細線。

  ⚠️ 座標要用「畫布尺寸 ÷ 顯示尺寸」換算，不能直接拿 clientX 減掉邊界——
  畫布被 CSS 縮放過，不換算的話筆跡會跟手指位置差一截。
*/
export default function CareSignature({
  identity,
  carryKey,
  carryLabel,
  onConfirm,
  onCancel,
}: {
  identity: string;
  /** 簽名庫的代號（見 signatureStore）；給了才會出現「帶入上次簽名」。 */
  carryKey?: string;
  /** 帶入按鈕上要說明的是誰的簽名，例如「護理長 婉真」。 */
  carryLabel?: string;
  onConfirm: (image: string) => void;
  onCancel: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [ink, setInk] = useState(false);
  const saved = useSignature(carryKey ?? null);
  /** 帶入後先預覽，按「確認」才真的寫進那一筆；可以再按「改成手寫」退回畫布。 */
  const [carried, setCarried] = useState<SignatureRecord | null>(null);

  function position(event: React.PointerEvent<HTMLCanvasElement>) {
    const target = canvas.current!;
    const rect = target.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) * target.width) / rect.width, y: ((event.clientY - rect.top) * target.height) / rect.height };
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const target = canvas.current!;
    const context = target.getContext("2d")!;
    const point = position(event);
    target.setPointerCapture(event.pointerId);
    drawing.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.1, point.y + 0.1);
    context.strokeStyle = "#292524";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
    setInk(true);
  }
  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const point = position(event);
    const context = canvas.current!.getContext("2d")!;
    context.lineTo(point.x, point.y);
    context.stroke();
  }
  function clear() {
    canvas.current!.getContext("2d")!.clearRect(0, 0, canvas.current!.width, canvas.current!.height);
    setInk(false);
  }
  function confirmDrawn() {
    const image = canvas.current!.toDataURL("image/png");
    // 簽完就記進簽名庫，下一張表單才有得帶（開發總則 #4）。
    if (carryKey) rememberSignature(carryKey, image, carryLabel ?? identity);
    onConfirm(image);
  }

  return <section className="space-y-3 rounded-xl border border-stone-300 bg-stone-50 p-4" aria-label="頁內簽名">
    <p className="text-sm font-medium">請確認簽名對象：{identity}</p>

    {carried ? (
      <div className="space-y-3">
        <div className="rounded-lg border-2 border-dashed border-brand-300 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={carried.image} alt="帶入的簽名" className="mx-auto h-32 w-auto max-w-full" />
        </div>
        <p className="text-xs text-stone-600">帶入 {carried.label} 於 {taipeiTimestamp(carried.at)} 的簽名。確認後會寫進本筆紀錄。</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => onConfirm(carried.image)}>確認帶入這個簽名</button>
          <button type="button" className={buttonStyles()} onClick={() => { setCarried(null); setInk(false); }}>改成重新手寫</button>
          <button type="button" className={buttonStyles()} onClick={onCancel}>取消簽名</button>
        </div>
      </div>
    ) : (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-stone-600">此簽名只屬於目前個案與本筆表單，不會帶到其他住民。</p>
          {saved && (
            <button type="button" className={buttonStyles({ size: "sm", className: "ml-auto" })} onClick={() => setCarried(saved)}>
              <Stamp className="h-3.5 w-3.5" aria-hidden="true" />
              帶入上次簽名
            </button>
          )}
        </div>
        <div className="relative">
          <canvas
            ref={canvas}
            width={1200}
            height={420}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={() => { drawing.current = false; }}
            onPointerCancel={() => { drawing.current = false; }}
            className="h-56 w-full touch-none rounded-xl border-2 border-dashed border-stone-400 bg-white md:h-72"
            aria-label="手寫簽名區"
          />
          {/* 空白時給一條簽名線與提示；有筆跡就讓開，不要疊在簽名上。 */}
          {!ink && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-300">
              <PenLine className="h-7 w-7" aria-hidden="true" />
              <span className="text-sm">請在框內簽名（可用手指或電子筆）</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={clear} className={buttonStyles()}>清除</button>
          <button type="button" onClick={onCancel} className={buttonStyles()}>取消簽名</button>
          <button type="button" disabled={!ink} onClick={confirmDrawn} className={buttonStyles({ variant: "primary", className: "ml-auto" })}>確認本筆簽名</button>
        </div>
      </>
    )}
  </section>;
}
