"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Save } from "lucide-react";

type Accent = "rose" | "sky" | "teal" | "brand";

const PRIMARY_CLASS: Record<Accent, string> = {
  rose: "bg-rose-500 hover:bg-rose-600",
  sky: "bg-sky-500 hover:bg-sky-600",
  teal: "bg-teal-600 hover:bg-teal-700",
  brand: "bg-brand-500 hover:bg-brand-600",
};

function formatTime(value: Date) {
  return value.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** 原型用自動時間：只在瀏覽器啟動，避免伺服器與瀏覽器渲染時間不一致。 */
export function usePrototypeClock() {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const refresh = () => setTime(formatTime(new Date()));
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return time;
}

export default function PrototypeFormActions({
  accent = "brand",
  submitLabel = "送出",
  draftLabel = "暫存",
  onDraft,
  onSubmit,
}: {
  accent?: Accent;
  submitLabel?: string;
  draftLabel?: string;
  onDraft?: () => void;
  onSubmit?: () => void;
}) {
  const now = usePrototypeClock();
  const [message, setMessage] = useState("尚未暫存");
  const [messageTone, setMessageTone] = useState<"idle" | "saved" | "submitted">("idle");

  function saveDraft() {
    onDraft?.();
    setMessage(`草稿已暫存 ${now}`);
    setMessageTone("saved");
  }

  function submit() {
    onSubmit?.();
    setMessage(`已完成原型送出 ${now}`);
    setMessageTone("submitted");
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-stone-500">
          <Clock3 className="h-3.5 w-3.5" />
          系統時間自動更新：<span className="font-mono text-stone-700">{now}</span>
        </span>
        <span
          aria-live="polite"
          className={
            "ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs " +
            (messageTone === "idle"
              ? "bg-stone-100 text-stone-400"
              : messageTone === "saved"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700")
          }
        >
          {messageTone !== "idle" && <CheckCircle2 className="h-3.5 w-3.5" />}
          {message}
        </span>
      </div>
      <div className="mt-2 flex justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={saveDraft}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-stone-600 shadow-sm ring-1 ring-stone-200 hover:bg-stone-100"
        >
          <Save className="h-3.5 w-3.5" />
          {draftLabel}
        </button>
        <button
          type="button"
          onClick={submit}
          className={`rounded-lg px-4 py-2 font-medium text-white ${PRIMARY_CLASS[accent]}`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
