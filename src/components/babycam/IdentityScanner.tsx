"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { readIdentityCode } from "@/lib/babycam/scan";

export default function IdentityScanner({ demoIdentityCode, onRead, onClose }: { demoIdentityCode: string; onRead: (code: string) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [detectedCode, setDetectedCode] = useState("");
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    dialog?.showModal();
    let disposed = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      disposed = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      if (video && video.srcObject === stream) video.srcObject = null;
    };
    const suspend = () => { if (document.hidden) { stop(); close(); } };
    const leave = () => { stop(); close(); };
    document.addEventListener("visibilitychange", suspend);
    window.addEventListener("pagehide", leave);

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unavailable");
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } } });
        if (disposed || !video) { stop(); return; }
        video.srcObject = stream;
        await video.play();
        const { default: jsQR } = await import("jsqr");
        if (disposed) return;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("unavailable");
        setReady(true);

        function scan() {
          if (disposed || !video || !context) return;
          try {
            if (video.readyState >= 2 && video.videoWidth) {
              canvas.width = Math.min(video.videoWidth, 720);
              canvas.height = Math.round(video.videoHeight * canvas.width / video.videoWidth);
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
              const result = jsQR(pixels.data, pixels.width, pixels.height);
              if (result) {
                const code = readIdentityCode(result.data);
                stop();
                setDetectedCode(code);
                setError("");
                return;
              }
            }
          } catch {
            setError("無法辨識這個標籤，請將手圈或嬰兒車上的 QRCode 對準畫面，或改用手動輸入。");
          }
          timer = setTimeout(scan, 180);
        }
        scan();
      } catch (cause) {
        if (disposed) return;
        stop();
        if (!dialog?.open) return;
        const denied = cause instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(cause.name);
        setUnavailable(true);
        setError(denied ? "相機權限未開啟。請允許此網站使用相機後重試，或改用手動輸入。" : "目前無法使用相機。請確認相機可用並以 HTTPS 開啟此頁，或改用手動輸入。");
      }
    }
    void start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", suspend);
      window.removeEventListener("pagehide", leave);
      dialog?.close();
    };
  }, []);

  return (
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="identity-scanner-title" aria-describedby="identity-scanner-hint" className={"m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-border-subtle bg-surface-raised p-4 text-stone-800 backdrop:bg-black/50 open:flex open:flex-col sm:p-5 " + (unavailable ? "" : "h-[92dvh] max-h-[1000px]")}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 id="identity-scanner-title" className="text-lg font-bold">掃描寶寶識別標籤</h2>
        <Button iconOnly size="lg" variant="ghost" aria-label="關閉掃碼" onClick={onClose}><X className="h-5 w-5" aria-hidden="true" /></Button>
      </div>
      <p id="identity-scanner-hint" className="mb-4 shrink-0 text-base leading-7 text-stone-600">將手圈或嬰兒車上的 QRCode 對準相機，再按「確認」帶入掃碼結果。</p>
      <video ref={videoRef} autoPlay muted playsInline aria-label="掃碼相機預覽" className={"min-h-0 w-full flex-1 rounded-xl bg-stone-900 object-contain " + (unavailable ? "hidden" : "")} />
      <p role={error ? "alert" : "status"} className={"mt-3 shrink-0 text-sm leading-6 " + (error ? "text-rose-700" : "text-stone-600")}>{error || (detectedCode ? "已讀取識別碼，請按「確認」帶入。" : ready ? "相機已開啟，請對準 QRCode。" : "正在開啟相機，請允許使用相機。")}</p>
      <p className="mt-3 shrink-0 text-sm leading-6 text-stone-600">示範操作可直接按「確認」，自動帶入所選寶寶的識別碼，再體驗「核對並歸位」。</p>
      <div className="mt-4 grid shrink-0 grid-cols-2 gap-3">
        <Button size="lg" onClick={onClose}>改用手動輸入</Button>
        <Button size="lg" variant="primary" disabled={!detectedCode && !demoIdentityCode} onClick={() => onRead(detectedCode || demoIdentityCode)}>確認</Button>
      </div>
    </dialog>
  );
}
