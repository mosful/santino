"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, TriangleAlert, X } from "lucide-react";

/*
  浮出式提示／錯誤訊息。

  原本各頁都把 message 印成頁面最上方的一行橫幅，案件清單填到第 6、7 階段時
  要往上捲才看得到，客戶實際回報過。改成固定浮在畫面上方、捲動不跟著走，
  自動消失（也可手動關閉）。

  成功＝綠色＋打勾、警告＝黃色＋三角、失敗＝紅色＋驚嘆號，圖示一併區分，
  不只靠顏色（色覺辨識）。警告與失敗都要讓人看完原因，停留比成功久，
  且用 role="alert" 讓讀屏立即唸出。

  ⚠️ 要靠 onDismiss 把來源 state 清掉：同一句訊息連續觸發兩次時，
  state 沒變就不會重新渲染，使用者會以為按鈕沒反應。useToast 每次 ok／fail
  都換一個新物件，同一句也會重新計時。
*/
export type ToastTone = "success" | "error" | "warning";

// 警告要讀完原因，停留比成功久；錯誤最久。
const AUTO_DISMISS_MS: Record<ToastTone, number> = { success: 5000, warning: 8000, error: 8000 };
const TONE_STYLE: Record<ToastTone, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-rose-300 bg-rose-50 text-rose-900",
};
const subscribeNothing = () => () => {};

export function Toast({ message, tone = "success", onDismiss }: { message: string; tone?: ToastTone; onDismiss: () => void }) {
  // 靜態匯出下伺服器端沒有 document，掛載後才建 portal（effect 內 setState 會 hydration 失敗）。
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  // 用 ref 存回呼，timer 才不會因為父層每次 render 產生新函式而重設。
  const dismiss = useRef(onDismiss);
  useEffect(() => { dismiss.current = onDismiss; });
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => dismiss.current(), AUTO_DISMISS_MS[tone]);
    return () => clearTimeout(timer);
  }, [message, tone]);

  if (!mounted || !message) return null;
  const Icon = tone === "success" ? CircleCheck : tone === "warning" ? TriangleAlert : CircleAlert;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4" data-no-print>
      {/* 關閉鈕沿用 globals.css 對原生按鈕的最小點擊區（40／44px），框高由它決定，所以容器用 items-center 置中。 */}
      <div role={tone === "success" ? "status" : "alert"} data-toast-tone={tone} className={`animate-fade-in-up pointer-events-auto flex max-w-xl items-center gap-2 rounded-xl border py-1.5 pl-3 pr-1.5 text-sm shadow-lg ${TONE_STYLE[tone]}`}>
        <Icon size={18} aria-hidden className={`shrink-0 ${tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-rose-600"}`} />
        <span className="whitespace-pre-line">{message}</span>
        <button type="button" aria-label="關閉訊息" onClick={() => dismiss.current()} className="w-10 shrink-0 rounded-lg opacity-70 hover:bg-black/5 hover:opacity-100">
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * 頁面用的訊息 state：`const [toast, toastProps] = useToast()`，
 * 觸發用 `toast.ok("…")`／`toast.fail("…")`，JSX 放 `<Toast {...toastProps} />`。
 * ⚠️ `toast` 永遠是同一個物件（可放進 effect 的 deps）；會變的只有 toastProps。
 */
export function useToast() {
  const [state, setState] = useState<{ message: string; tone: ToastTone }>({ message: "", tone: "success" });
  const ok = useCallback((message: string) => setState({ message, tone: "success" }), []);
  const fail = useCallback((message: string) => setState({ message, tone: "error" }), []);
  /** 不合規但已經放行（見 lib/demo/lenient）：黃色提醒，動作仍然做了。 */
  const warn = useCallback((message: string) => setState({ message, tone: "warning" }), []);
  const clear = useCallback(() => setState((current) => (current.message ? { message: "", tone: current.tone } : current)), []);
  const toast = useMemo(() => ({ ok, fail, warn, clear }), [ok, fail, warn, clear]);
  const toastProps = useMemo(() => ({ message: state.message, tone: state.tone, onDismiss: clear }), [state, clear]);
  return [toast, toastProps] as const;
}
