"use client";

import { useEffect, useState } from "react";
import { EyeOff, VideoOff } from "lucide-react";

export type PreviewMode = "live" | "snapshot" | "masked" | "offline";

/**
 * 假影像元件：靜態畫面稿沒有真實攝影機，以純 SVG 畫嬰兒床示意圖代替。
 * live 模式每秒更新時間戳，用來示範「1 秒快照輪詢」的實際體感。
 *
 * 為避免 output:"export" 靜態匯出時的 hydration mismatch，
 * 首次渲染一律用固定字串，時間戳等掛載後才開始跳動。
 */
export default function CamPreview({
  mode,
  room,
  camCode,
  statusLabel,
  watermark,
  capturedAgo,
}: {
  mode: PreviewMode;
  room: string;
  camCode: string;
  /** masked 模式顯示的狀態名稱，例如「護理中」 */
  statusLabel?: string;
  /** 浮水印文字（房號＋觀看者手機末三碼） */
  watermark?: string;
  /** snapshot 模式的「N 分鐘前」提示 */
  capturedAgo?: string;
}) {
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    if (mode !== "live" && mode !== "snapshot") return;
    const tick = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      setClock(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-stone-700 bg-stone-900 shadow-inner">
      {mode === "masked" || mode === "offline" ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-stone-400">
          {mode === "masked" ? (
            <EyeOff className="h-10 w-10" />
          ) : (
            <VideoOff className="h-10 w-10" />
          )}
          <div className="text-center">
            <p className="text-base font-semibold text-stone-200">
              {mode === "masked" ? statusLabel ?? "暫停顯示" : "設備維護中"}
            </p>
            <p className="mt-1 text-xs">
              {mode === "masked"
                ? "此時段畫面暫不開放，請稍候"
                : "攝影機目前無法連線，院方已收到通知"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <NurseryScene />
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {mode === "live" && (
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
            )}
            <span>
              {room} 房 · {camCode}
            </span>
          </div>
          <div className="absolute right-2 top-2 rounded-md bg-black/45 px-2 py-1 text-[11px] font-mono text-white tabular-nums backdrop-blur-sm">
            {clock}
          </div>
          {capturedAgo && (
            <div className="absolute inset-x-0 bottom-0 bg-amber-500/85 px-2 py-1 text-center text-[11px] font-medium text-amber-950">
              目前顯示的是 {capturedAgo}的畫面
            </div>
          )}
          {watermark && (
            <div
              className={
                "absolute right-2 text-[10px] font-mono text-white/55 " +
                (capturedAgo ? "bottom-8" : "bottom-2")
              }
            >
              {watermark}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** 嬰兒床示意圖：純 SVG，不使用任何真實照片 */
function NurseryScene() {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bc-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f3640" />
          <stop offset="100%" stopColor="#1e232b" />
        </linearGradient>
        <linearGradient id="bc-crib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b93a1" />
          <stop offset="100%" stopColor="#5c6470" />
        </linearGradient>
      </defs>

      <rect width="320" height="180" fill="url(#bc-wall)" />
      {/* 地板 */}
      <rect y="126" width="320" height="54" fill="#272c34" />
      {/* 牆面窗框 */}
      <rect x="18" y="22" width="58" height="42" rx="3" fill="#39414c" />
      <line x1="47" y1="22" x2="47" y2="64" stroke="#2b323b" strokeWidth="2" />
      {/* 嬰兒床 */}
      <rect x="104" y="72" width="112" height="54" rx="6" fill="url(#bc-crib)" />
      <rect x="110" y="78" width="100" height="30" rx="4" fill="#e9eef5" />
      {/* 包巾中的寶寶 */}
      <ellipse cx="160" cy="93" rx="30" ry="13" fill="#f6d9c6" />
      <circle cx="136" cy="93" r="8" fill="#f3c6ad" />
      <path d="M130 86 q6 -7 13 -2" stroke="#d9a98c" strokeWidth="1.6" fill="none" />
      {/* 床腳 */}
      <rect x="110" y="126" width="6" height="14" fill="#4a515c" />
      <rect x="204" y="126" width="6" height="14" fill="#4a515c" />
      {/* 監測儀 */}
      <rect x="244" y="60" width="44" height="34" rx="4" fill="#39414c" />
      <rect x="249" y="65" width="34" height="18" rx="2" fill="#16351f" />
      <polyline
        points="251,76 256,76 259,70 263,82 267,74 272,76 281,76"
        fill="none"
        stroke="#4ade80"
        strokeWidth="1.4"
      />
      <rect x="262" y="94" width="8" height="32" fill="#4a515c" />
      {/* 地面陰影 */}
      <ellipse cx="160" cy="142" rx="66" ry="7" fill="#1b1f26" opacity="0.7" />
    </svg>
  );
}
